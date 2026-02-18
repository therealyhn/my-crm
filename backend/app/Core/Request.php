<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    private array $jsonCache = [];

    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path)) {
            return '/';
        }

        $normalized = rtrim($path, '/') ?: '/';
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $basePath = rtrim(str_replace('\\', '/', dirname((string) $scriptName)), '/');

        if ($basePath !== '' && $basePath !== '/' && str_starts_with($normalized, $basePath)) {
            $normalized = substr($normalized, strlen($basePath));
            $normalized = $normalized === '' ? '/' : $normalized;
        }

        return $normalized;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function allQuery(): array
    {
        return $_GET;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        $json = $this->json();
        if (array_key_exists($key, $json)) {
            return $json[$key];
        }

        return $_POST[$key] ?? $default;
    }

    public function json(): array
    {
        if ($this->jsonCache !== []) {
            return $this->jsonCache;
        }

        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        $this->jsonCache = $decoded;

        return $this->jsonCache;
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return isset($_SERVER[$serverKey]) ? trim((string) $_SERVER[$serverKey]) : $default;
    }

    public function cookie(string $name, ?string $default = null): ?string
    {
        return isset($_COOKIE[$name]) ? (string) $_COOKIE[$name] : $default;
    }

    public function ip(): string
    {
        $ip = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
        if ($ip === '') {
            return '0.0.0.0';
        }

        return $ip;
    }

    public function isStateChanging(): bool
    {
        return in_array($this->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
    }
}
