<?php

declare(strict_types=1);

namespace App\Core;

final class Config
{
    public static function app(): array
    {
        $allowedOrigins = array_values(array_filter(array_map(
            static fn (string $origin): string => trim($origin),
            explode(',', Env::get('CORS_ALLOWED_ORIGIN', ''))
        )));

        return [
            'env' => Env::get('APP_ENV', 'production'),
            'debug' => Env::bool('APP_DEBUG', false),
            'url' => Env::get('APP_URL', ''),
            'frontend_url' => Env::get('FRONTEND_URL', ''),
            'cors_allowed_origins' => $allowedOrigins,
            'session_cookie' => Env::get('SESSION_COOKIE', 'crm_session'),
            'session_secure' => Env::bool('SESSION_SECURE', false),
            'session_samesite' => Env::get('SESSION_SAMESITE', 'Lax'),
            'max_upload_mb' => Env::int('MAX_UPLOAD_MB', 10),
            'mail_from_address' => Env::get('MAIL_FROM_ADDRESS', 'noreply@localhost'),
            'mail_from_name' => Env::get('MAIL_FROM_NAME', 'Client CRM Portal'),
            'notify_new_task_emails' => array_values(array_filter(array_map(
                static fn (string $value): string => trim($value),
                explode(',', Env::get('NOTIFY_NEW_TASK_EMAILS', ''))
            ))),
            'auth_login_window_seconds' => Env::int('AUTH_LOGIN_WINDOW_SECONDS', 900),
            'auth_login_max_attempts' => Env::int('AUTH_LOGIN_MAX_ATTEMPTS', 5),
            'auth_login_lockout_seconds' => Env::int('AUTH_LOGIN_LOCKOUT_SECONDS', 900),
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
