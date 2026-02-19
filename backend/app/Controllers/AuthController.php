<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Csrf;
use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\SessionManager;
use App\Services\AuthThrottleService;
use App\Validators\ApiValidator;
use PDO;

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

    public function changePassword(Request $request, array $params): Response
    {
        unset($params);

        $user = $this->currentUser();
        $userId = (int) $user['id'];

        $currentPassword = ApiValidator::requiredString($request->input('current_password'), 'current_password', 255);
        $newPassword = ApiValidator::requiredString($request->input('new_password'), 'new_password', 255);
        $confirmPassword = ApiValidator::requiredString($request->input('confirm_password'), 'confirm_password', 255);

        if (mb_strlen($newPassword) < 8) {
            throw new HttpException(422, 'validation_error', 'new_password must be at least 8 characters.');
        }

        if ($newPassword !== $confirmPassword) {
            throw new HttpException(422, 'validation_error', 'confirm_password does not match new_password.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT password_hash FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($row) || !isset($row['password_hash'])) {
            throw new HttpException(404, 'not_found', 'User not found.');
        }

        $storedHash = (string) $row['password_hash'];
        if (!password_verify($currentPassword, $storedHash)) {
            throw new HttpException(422, 'validation_error', 'Current password is incorrect.');
        }

        if (password_verify($newPassword, $storedHash)) {
            throw new HttpException(422, 'validation_error', 'New password must be different from current password.');
        }

        $updateStmt = Database::connection()->prepare(
            'UPDATE users
             SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $updateStmt->execute([
            ':id' => $userId,
            ':password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        return Response::json([
            'data' => [
                'updated' => $updateStmt->rowCount() > 0,
            ],
        ]);
    }
}
