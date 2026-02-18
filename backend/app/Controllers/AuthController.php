<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\SessionManager;
use App\Services\AuthThrottleService;
use App\Validators\ApiValidator;

final class AuthController extends BaseController
{
    public function login(Request $request, array $params): Response
    {
        unset($params);

        SessionManager::start();

        $email = ApiValidator::requiredString($request->input('email'), 'email', 190);
        $password = ApiValidator::requiredString($request->input('password'), 'password', 255);
        $ip = $request->ip();
        $throttle = new AuthThrottleService();

        $blockedUntil = $throttle->blockedUntil($email, $ip);
        if ($blockedUntil !== null) {
            $retryAfter = max(1, $blockedUntil - time());

            return Response::json([
                'error' => 'too_many_attempts',
                'message' => 'Too many login attempts. Please try again later.',
                'retry_after_seconds' => $retryAfter,
            ], 429, [
                'Retry-After' => (string) $retryAfter,
            ]);
        }

        $user = Auth::login($email, $password);
        if ($user === null) {
            $throttle->recordFailure($email, $ip);

            return Response::json([
                'error' => 'invalid_credentials',
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $throttle->clear($email, $ip);

        $stmt = Database::connection()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $user['id']]);

        return Response::json([
            'data' => [
                'user' => Auth::user(),
                'csrf_token' => Csrf::token(),
            ],
        ]);
    }

    public function logout(Request $request, array $params): Response
    {
        unset($request, $params);

        Auth::logout();

        return Response::json([
            'data' => [
                'logged_out' => true,
            ],
        ]);
    }

    public function me(Request $request, array $params): Response
    {
        unset($request, $params);

        SessionManager::start();
        $user = Auth::user();

        return Response::json([
            'data' => [
                'user' => $user,
            ],
        ]);
    }
}
