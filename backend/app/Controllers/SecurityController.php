<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Csrf;
use App\Core\Request;
use App\Core\Response;
use App\Core\SessionManager;

final class SecurityController
{
    public function csrfToken(Request $request, array $params): Response
    {
        unset($request, $params);

        SessionManager::start();

        return Response::json([
            'data' => [
                'csrf_token' => Csrf::token(),
            ],
        ]);
    }
}
