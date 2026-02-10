<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Auth;
use App\Core\HttpException;
use App\Core\MiddlewareInterface;
use App\Core\Request;
use App\Core\Response;

final class AdminMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        $user = Auth::user();
        if (!is_array($user) || ($user['role'] ?? '') !== 'admin') {
            throw new HttpException(403, 'forbidden', 'Admin access required.');
        }

        return $next($request);
    }
}
