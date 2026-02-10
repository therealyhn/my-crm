<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class ProjectRepository
{
    public function findClientIdByProjectId(int $projectId): ?int
    {
        $stmt = Database::connection()->prepare('SELECT client_id FROM projects WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $projectId]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || !isset($row['client_id'])) {
            return null;
        }

        return (int) $row['client_id'];
    }
}
