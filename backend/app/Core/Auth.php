<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

final class Auth
{
    public static function user(): ?array
    {
        SessionManager::start();

        $userId = $_SESSION['user_id'] ?? null;
        if (!is_int($userId) && !ctype_digit((string) $userId)) {
            return null;
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, client_id, name, email, role, is_active
             FROM users
             WHERE id = :id
             LIMIT 1'
        );

        $stmt->execute([':id' => (int) $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($user) || (int) ($user['is_active'] ?? 0) !== 1) {
            return null;
        }

        $user['id'] = (int) $user['id'];
        $user['client_id'] = $user['client_id'] !== null ? (int) $user['client_id'] : null;

        return $user;
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function login(string $email, string $password): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, client_id, name, email, role, password_hash, is_active
             FROM users
             WHERE email = :email
             LIMIT 1'
        );
        $stmt->execute([':email' => $email]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($user) || (int) ($user['is_active'] ?? 0) !== 1) {
            return null;
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            return null;
        }

        SessionManager::regenerate();
        $_SESSION['user_id'] = (int) $user['id'];

        unset($user['password_hash']);
        $user['id'] = (int) $user['id'];
        $user['client_id'] = $user['client_id'] !== null ? (int) $user['client_id'] : null;

        return $user;
    }

    public static function logout(): void
    {
        SessionManager::start();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }

        session_destroy();
    }
}
