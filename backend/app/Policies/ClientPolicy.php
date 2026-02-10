<?php

declare(strict_types=1);

namespace App\Policies;

final class ClientPolicy
{
    public function canAccessClient(array $user, int $clientId): bool
    {
        if (($user['role'] ?? '') === 'admin') {
            return true;
        }

        return isset($user['client_id']) && (int) $user['client_id'] === $clientId;
    }
}
