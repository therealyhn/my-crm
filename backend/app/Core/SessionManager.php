<?php

declare(strict_types=1);

namespace App\Core;

final class SessionManager
{
    private static bool $started = false;

    public static function start(): void
    {
        if (self::$started || session_status() === PHP_SESSION_ACTIVE) {
            self::$started = true;
            return;
        }

        $appConfig = Config::app();

        session_name($appConfig['session_cookie']);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $appConfig['session_secure'],
            'httponly' => true,
            'samesite' => $appConfig['session_samesite'],
        ]);

        session_start();
        self::$started = true;
    }

    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }
}
