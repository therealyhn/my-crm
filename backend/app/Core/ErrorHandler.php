<?php

declare(strict_types=1);

namespace App\Core;

use Throwable;

final class ErrorHandler
{
    public static function register(): void
    {
        set_exception_handler([self::class, 'handle']);
    }

    public static function handle(Throwable $exception): void
    {
        $appConfig = Config::app();
        $debug = $appConfig['debug'];

        $status = 500;
        $error = 'server_error';
        $message = 'Unexpected server error.';

        if ($exception instanceof HttpException) {
            $status = $exception->status();
            $error = $exception->error();
            $message = $exception->getMessage();
        }

        self::log($exception);

        $payload = [
            'error' => $error,
            'message' => $message,
        ];

        if ($debug) {
            $payload['debug'] = [
                'type' => $exception::class,
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }

        Response::json($payload, $status)->send();
    }

    private static function log(Throwable $exception): void
    {
        $logDir = dirname(__DIR__, 2) . '/storage/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0775, true);
        }

        $logPath = $logDir . '/app.log';
        $line = sprintf(
            "[%s] %s: %s in %s:%d\n",
            date('c'),
            $exception::class,
            $exception->getMessage(),
            $exception->getFile(),
            $exception->getLine()
        );

        file_put_contents($logPath, $line, FILE_APPEND);
    }
}
