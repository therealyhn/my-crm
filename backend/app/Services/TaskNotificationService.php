<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Database;
use PDO;
use Throwable;

final class TaskNotificationService
{
    public function sendTaskCreated(int $taskId): void
    {
        $task = $this->loadTask($taskId);
        if ($task === null) {
            return;
        }

        $recipients = $this->resolveRecipients();
        if ($recipients === []) {
            return;
        }

        $appConfig = Config::app();
        $frontendUrl = rtrim((string) ($appConfig['frontend_url'] ?? ''), '/');
        $taskUrl = $frontendUrl !== '' ? $frontendUrl . '/admin/tasks/' . $taskId : '';

        $subject = sprintf('[Client CRM] New task #%d: %s', $taskId, (string) $task['title']);

        $lines = [
            'A new task was created in Client CRM Portal.',
            '',
            'Task ID: ' . $taskId,
            'Title: ' . (string) $task['title'],
            'Type: ' . (string) $task['task_type'],
            'Priority: ' . (string) $task['priority'],
            'Status: ' . (string) $task['status'],
            'Client: ' . (string) $task['client_name'],
            'Project: ' . (string) $task['project_name'],
            'Created by: ' . (string) $task['creator_name'] . ' (' . (string) $task['creator_email'] . ')',
            '',
        ];

        if ($taskUrl !== '') {
            $lines[] = 'Open task: ' . $taskUrl;
            $lines[] = '';
        }

        $message = implode("\n", $lines);
        $headers = $this->buildHeaders();

        foreach ($recipients as $email) {
            $sent = @mail($email, $subject, $message, $headers);
            if (!$sent) {
                $this->logMailFailure('mail_failed', $taskId, $email);
            }
        }
    }

    private function loadTask(int $taskId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT t.id, t.title, t.task_type, t.priority, t.status,
                    p.name AS project_name,
                    c.name AS client_name,
                    u.name AS creator_name,
                    u.email AS creator_email
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             INNER JOIN clients c ON c.id = p.client_id
             INNER JOIN users u ON u.id = t.created_by_user_id
             WHERE t.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        return is_array($task) ? $task : null;
    }

    private function resolveRecipients(): array
    {
        $appConfig = Config::app();
        $configured = $appConfig['notify_new_task_emails'] ?? [];
        if (is_array($configured) && $configured !== []) {
            return array_values(array_filter(array_unique(array_map(
                static fn (string $email): string => strtolower(trim($email)),
                $configured
            )), static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false));
        }

        $rows = Database::connection()->query(
            "SELECT email FROM users WHERE role = 'admin' AND is_active = 1"
        )->fetchAll(PDO::FETCH_ASSOC);

        return array_values(array_filter(array_unique(array_map(
            static fn (array $row): string => strtolower(trim((string) ($row['email'] ?? ''))),
            $rows
        )), static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false));
    }

    private function buildHeaders(): string
    {
        $appConfig = Config::app();
        $fromAddress = (string) ($appConfig['mail_from_address'] ?? 'noreply@localhost');
        $fromName = trim((string) ($appConfig['mail_from_name'] ?? 'Client CRM Portal'));
        $safeFromName = str_replace(["\r", "\n"], '', $fromName);
        $safeFromAddress = str_replace(["\r", "\n"], '', $fromAddress);

        return "From: {$safeFromName} <{$safeFromAddress}>\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n";
    }

    private function logMailFailure(string $reason, int $taskId, string $email): void
    {
        try {
            $logDir = dirname(__DIR__, 2) . '/storage/logs';
            if (!is_dir($logDir)) {
                mkdir($logDir, 0775, true);
            }

            $line = sprintf(
                "[%s] task_notification_error: %s task_id=%d email=%s\n",
                date('c'),
                $reason,
                $taskId,
                $email
            );

            file_put_contents($logDir . '/app.log', $line, FILE_APPEND);
        } catch (Throwable) {
            // Suppress logging failures to avoid affecting request flow.
        }
    }
}
