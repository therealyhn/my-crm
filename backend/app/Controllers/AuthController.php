<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\SessionManager;

final class AuthController
{
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
