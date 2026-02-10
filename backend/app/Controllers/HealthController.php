<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Request;
use App\Core\Response;

final class HealthController
{
    public function index(Request $request, array $params): Response
    {
        unset($request, $params);

        return Response::json([
            'status' => 'ok',
            'service' => 'client-crm-backend',
            'env' => Config::app()['env'],
            'server_time' => gmdate('c'),
        ]);
    }
}
