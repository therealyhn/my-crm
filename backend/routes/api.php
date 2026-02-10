<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\HealthController;
use App\Controllers\SecurityController;

$router->get('/api/health', [HealthController::class, 'index']);
$router->get('/api/csrf-token', [SecurityController::class, 'csrfToken']);
$router->get('/api/auth/me', [AuthController::class, 'me']);
