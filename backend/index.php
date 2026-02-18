<?php

declare(strict_types=1);

use App\Core\App;
use App\Core\Config;
use App\Core\ErrorHandler;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;

require_once __DIR__ . '/bootstrap.php';

ErrorHandler::register();

$appConfig = Config::app();
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $appConfig['cors_allowed_origins'] ?? [];

if (is_string($requestOrigin) && $requestOrigin !== '' && is_array($allowedOrigins) && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    Response::noContent()->send();
    exit;
}

$router = new Router();
require __DIR__ . '/routes/api.php';

$request = new Request();
$response = (new App($router))->run($request);
$response->send();
