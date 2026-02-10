<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class TaskRepository
{
    public function findClientIdByTaskId(int $taskId): ?int
    {
        $stmt = Database::connection()->prepare(
            'SELECT p.client_id
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             WHERE t.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $taskId]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row) || !isset($row['client_id'])) {
            return null;
        }

        return (int) $row['client_id'];
    }
}
