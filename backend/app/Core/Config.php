<?php

declare(strict_types=1);

namespace App\Core;

final class Config
{
    public static function app(): array
    {
        return [
            'env' => Env::get('APP_ENV', 'production'),
            'debug' => Env::bool('APP_DEBUG', false),
            'url' => Env::get('APP_URL', ''),
            'cors_allowed_origin' => Env::get('CORS_ALLOWED_ORIGIN', '*'),
            'session_cookie' => Env::get('SESSION_COOKIE', 'crm_session'),
            'session_secure' => Env::bool('SESSION_SECURE', false),
            'session_samesite' => Env::get('SESSION_SAMESITE', 'Lax'),
            'max_upload_mb' => Env::int('MAX_UPLOAD_MB', 10),
        ];
    }

    public static function database(): array
    {
        return [
            'host' => Env::get('DB_HOST', '127.0.0.1'),
            'port' => Env::int('DB_PORT', 3306),
            'name' => Env::get('DB_NAME', ''),
            'user' => Env::get('DB_USER', ''),
            'pass' => Env::get('DB_PASS', ''),
        ];
    }
}
