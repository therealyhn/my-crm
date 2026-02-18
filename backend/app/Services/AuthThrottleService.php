<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;

final class AuthThrottleService
{
    public function blockedUntil(string $email, string $ip): ?int
    {
        $emailKey = $this->key('email:' . strtolower(trim($email)));
        $ipKey = $this->key('ip:' . trim($ip));
        $comboKey = $this->key('combo:' . strtolower(trim($email)) . '|' . trim($ip));

        $maxBlockedUntil = 0;
        foreach ([$emailKey, $ipKey, $comboKey] as $key) {
            $state = $this->readState($key);
            $blockedUntil = (int) ($state['blocked_until'] ?? 0);
            if ($blockedUntil > $maxBlockedUntil) {
                $maxBlockedUntil = $blockedUntil;
            }
        }

        return $maxBlockedUntil > time() ? $maxBlockedUntil : null;
    }

    public function recordFailure(string $email, string $ip): void
    {
        $keys = [
            $this->key('email:' . strtolower(trim($email))),
            $this->key('ip:' . trim($ip)),
            $this->key('combo:' . strtolower(trim($email)) . '|' . trim($ip)),
        ];

        foreach ($keys as $key) {
            $this->mutateState($key, function (array $state): array {
                $config = Config::app();
                $window = max(60, (int) ($config['auth_login_window_seconds'] ?? 900));
                $maxAttempts = max(3, (int) ($config['auth_login_max_attempts'] ?? 5));
                $lockout = max(60, (int) ($config['auth_login_lockout_seconds'] ?? 900));
                $now = time();

                $attempts = array_values(array_filter(
                    array_map('intval', (array) ($state['attempts'] ?? [])),
                    static fn (int $ts): bool => $ts >= ($now - $window)
                ));
                $attempts[] = $now;

                $blockedUntil = (int) ($state['blocked_until'] ?? 0);
                if (count($attempts) >= $maxAttempts) {
                    $blockedUntil = max($blockedUntil, $now + $lockout);
                }

                return [
                    'attempts' => $attempts,
                    'blocked_until' => $blockedUntil,
                ];
            });
        }
    }

    public function clear(string $email, string $ip): void
    {
        $keys = [
            $this->key('email:' . strtolower(trim($email))),
            $this->key('combo:' . strtolower(trim($email)) . '|' . trim($ip)),
        ];

        foreach ($keys as $key) {
            $path = $this->statePath($key);
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    private function key(string $raw): string
    {
        return hash('sha256', $raw);
    }

    private function statePath(string $key): string
    {
        $dir = dirname(__DIR__, 2) . '/storage/cache/auth-throttle';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        return $dir . '/' . $key . '.json';
    }

    private function readState(string $key): array
    {
        $path = $this->statePath($key);
        if (!is_file($path)) {
            return ['attempts' => [], 'blocked_until' => 0];
        }

        $raw = file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            return ['attempts' => [], 'blocked_until' => 0];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return ['attempts' => [], 'blocked_until' => 0];
        }

        return [
            'attempts' => (array) ($decoded['attempts'] ?? []),
            'blocked_until' => (int) ($decoded['blocked_until'] ?? 0),
        ];
    }

    private function mutateState(string $key, callable $mutator): void
    {
        $path = $this->statePath($key);
        $state = $this->readState($key);
        $next = $mutator($state);

        $payload = json_encode($next, JSON_UNESCAPED_SLASHES);
        if (!is_string($payload)) {
            return;
        }

        file_put_contents($path, $payload, LOCK_EX);
    }
}
