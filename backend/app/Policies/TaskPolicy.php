<?php

declare(strict_types=1);

namespace App\Policies;

use App\Repositories\TaskRepository;

final class TaskPolicy
{
    public function __construct(private readonly TaskRepository $taskRepository = new TaskRepository())
    {
    }

    public function canAccessTask(array $user, int $taskId): bool
    {
        if (($user['role'] ?? '') === 'admin') {
            return true;
        }

        $clientId = $this->taskRepository->findClientIdByTaskId($taskId);
        if ($clientId === null) {
            return false;
        }

        return isset($user['client_id']) && (int) $user['client_id'] === $clientId;
    }
}
