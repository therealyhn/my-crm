<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\SessionManager;
use App\Validators\ApiValidator;

final class AuthController extends BaseController
{
    public function login(Request $request, array $params): Response
    {
        unset($params);

        SessionManager::start();

        $email = ApiValidator::requiredString($request->input('email'), 'email', 190);
        $password = ApiValidator::requiredString($request->input('password'), 'password', 255);

        $user = Auth::login($email, $password);
        if ($user === null) {
            return Response::json([
                'error' => 'invalid_credentials',
                'message' => 'Invalid email or password.',
            ], 401);
        }

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
