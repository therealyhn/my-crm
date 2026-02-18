<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use PDO;

final class NotificationService
{
    public function notifyClientUsersForTask(
        int $taskId,
        int $actorUserId,
        string $type,
        string $title,
        string $message
    ): void {
        $task = $this->taskContext($taskId);
        if ($task === null) {
            return;
        }

        $recipients = $this->clientUsers((int) $task['client_id']);
        if ($recipients === []) {
            return;
        }

        $dataJson = json_encode([
            'task_id' => $taskId,
            'task_title' => (string) $task['task_title'],
            'project_name' => (string) $task['project_name'],
            'client_name' => (string) $task['client_name'],
        ], JSON_UNESCAPED_SLASHES);

        $stmt = Database::connection()->prepare(
            'INSERT INTO notifications
                (user_id, client_id, task_id, actor_user_id, type, title, message, data_json, is_read)
             VALUES
                (:user_id, :client_id, :task_id, :actor_user_id, :type, :title, :message, :data_json, 0)'
        );

        foreach ($recipients as $recipientUserId) {
            $stmt->execute([
                ':user_id' => $recipientUserId,
                ':client_id' => (int) $task['client_id'],
                ':task_id' => $taskId,
                ':actor_user_id' => $actorUserId,
                ':type' => $type,
                ':title' => $title,
                ':message' => $message,
                ':data_json' => $dataJson !== false ? $dataJson : null,
            ]);
        }
    }

    private function taskContext(int $taskId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT t.id AS task_id,
                    t.title AS task_title,
                    p.id AS project_id,
                    p.name AS project_name,
                    c.id AS client_id,
                    c.name AS client_name
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             INNER JOIN clients c ON c.id = p.client_id
             WHERE t.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $taskId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : null;
    }

    private function clientUsers(int $clientId): array
    {
        $stmt = Database::connection()->prepare(
            "SELECT id
             FROM users
             WHERE client_id = :client_id
               AND role = 'client'
               AND is_active = 1"
        );
        $stmt->execute([':client_id' => $clientId]);

        return array_map(
            static fn (array $row): int => (int) $row['id'],
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }
}
