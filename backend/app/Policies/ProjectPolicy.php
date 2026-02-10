<?php

declare(strict_types=1);

namespace App\Policies;

use App\Repositories\ProjectRepository;

final class ProjectPolicy
{
    public function __construct(private readonly ProjectRepository $projectRepository = new ProjectRepository())
    {
    }

    public function canAccessProject(array $user, int $projectId): bool
    {
        if (($user['role'] ?? '') === 'admin') {
            return true;
        }

        $clientId = $this->projectRepository->findClientIdByProjectId($projectId);
        if ($clientId === null) {
            return false;
        }

        return isset($user['client_id']) && (int) $user['client_id'] === $clientId;
    }
}
