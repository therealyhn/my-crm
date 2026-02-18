<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Csrf;
use App\Core\HttpException;
use App\Core\MiddlewareInterface;
use App\Core\Request;
use App\Core\Response;

final class CsrfMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        if ($request->isStateChanging() && !Csrf::validate($request)) {
            throw new HttpException(403, 'csrf_mismatch', 'CSRF token is invalid or missing.');
        }

        return $next($request);
    }
}
