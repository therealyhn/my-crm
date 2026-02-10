<?php

declare(strict_types=1);

namespace App\Core;

final class Csrf
{
    public static function token(): string
    {
        SessionManager::start();

        if (!isset($_SESSION['_csrf_token']) || !is_string($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['_csrf_token'];
    }

    public static function validate(Request $request): bool
    {
        SessionManager::start();

        $sessionToken = $_SESSION['_csrf_token'] ?? null;
        if (!is_string($sessionToken) || $sessionToken === '') {
            return false;
        }

        $headerToken = $request->header('X-CSRF-Token');
        $bodyToken = $request->input('_csrf');

        $providedToken = is_string($headerToken) && $headerToken !== '' ? $headerToken : (is_string($bodyToken) ? $bodyToken : '');

        return $providedToken !== '' && hash_equals($sessionToken, $providedToken);
    }
}
