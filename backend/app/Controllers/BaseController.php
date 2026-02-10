<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\HttpException;

abstract class BaseController
{
    protected function currentUser(): array
    {
        $user = Auth::user();
        if (!is_array($user)) {
            throw new HttpException(401, 'unauthorized', 'Authentication required.');
        }

        return $user;
    }

    protected function ensureAdmin(array $user): void
    {
        if (($user['role'] ?? '') !== 'admin') {
            throw new HttpException(403, 'forbidden', 'Admin access required.');
        }
    }
}
