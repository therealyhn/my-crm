<?php

declare(strict_types=1);

use App\Controllers\AttachmentController;
use App\Controllers\AuthController;
use App\Controllers\ClientController;
use App\Controllers\CommentController;
use App\Controllers\HealthController;
use App\Controllers\ProjectController;
use App\Controllers\ReportController;
use App\Controllers\SecurityController;
use App\Controllers\TaskController;
use App\Controllers\TimeLogController;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;

$router->get('/api/health', [HealthController::class, 'index']);
$router->get('/api/csrf-token', [SecurityController::class, 'csrfToken']);

$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->get('/api/auth/me', [AuthController::class, 'me']);

$router->get('/api/clients', [ClientController::class, 'index'], [AuthMiddleware::class]);
$router->post('/api/clients', [ClientController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/clients/{id}', [ClientController::class, 'update'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/clients/{id}', [ClientController::class, 'destroy'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/projects', [ProjectController::class, 'index'], [AuthMiddleware::class]);
$router->get('/api/projects/{id}', [ProjectController::class, 'show'], [AuthMiddleware::class]);
$router->post('/api/projects', [ProjectController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/projects/{id}', [ProjectController::class, 'update'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/projects/{id}', [ProjectController::class, 'destroy'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/tasks', [TaskController::class, 'index'], [AuthMiddleware::class]);
$router->post('/api/tasks', [TaskController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->get('/api/tasks/{id}', [TaskController::class, 'show'], [AuthMiddleware::class]);
$router->put('/api/tasks/{id}', [TaskController::class, 'update'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->patch('/api/tasks/{id}/status', [TaskController::class, 'updateStatus'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/tasks/{id}', [TaskController::class, 'destroy'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/tasks/{id}/comments', [CommentController::class, 'index'], [AuthMiddleware::class]);
$router->post('/api/tasks/{id}/comments', [CommentController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/tasks/{id}/attachments', [AttachmentController::class, 'indexByTask'], [AuthMiddleware::class]);
$router->post('/api/tasks/{id}/attachments', [AttachmentController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->get('/api/attachments/{id}', [AttachmentController::class, 'show'], [AuthMiddleware::class]);
$router->delete('/api/attachments/{id}', [AttachmentController::class, 'destroy'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/tasks/{id}/timelogs', [TimeLogController::class, 'index'], [AuthMiddleware::class]);
$router->post('/api/tasks/{id}/timelogs', [TimeLogController::class, 'store'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/timelogs/{id}', [TimeLogController::class, 'update'], [AuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/timelogs/{id}', [TimeLogController::class, 'destroy'], [AuthMiddleware::class, CsrfMiddleware::class]);

$router->get('/api/reports/summary', [ReportController::class, 'summary'], [AuthMiddleware::class]);
