<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Database;
use PDO;
use Throwable;

final class ClientTaskEmailService
{
    public function sendAdminTaskUpdate(int $taskId, int $actorUserId, string $event = 'task_updated'): void
    {
        $appConfig = Config::app();
        if (!(bool) ($appConfig['notify_client_task_update_emails'] ?? true)) {
            return;
        }

        $task = $this->taskContext($taskId);
        if ($task === null) {
            return;
        }

        $recipients = $this->clientUsers((int) $task['client_id']);
        if ($recipients === []) {
            return;
        }

        $cooldown = max(60, (int) ($appConfig['client_task_update_email_cooldown_seconds'] ?? 900));
        $subject = sprintf('[Client CRM] Update on task #%d: %s', $taskId, (string) $task['task_title']);
        $message = $this->buildMessage($task, $event);
        $headers = $this->buildHeaders();

        foreach ($recipients as $recipient) {
            $recipientId = (int) ($recipient['id'] ?? 0);
            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($recipientId <= 0 || $email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }

            if ($this->isCoolingDown($taskId, $recipientId, $cooldown)) {
                continue;
            }

            $sent = @mail($email, $subject, $message, $headers);
            if (!$sent) {
                $this->logMailFailure('mail_failed', $taskId, $email);
                continue;
            }

            $this->markSent($taskId, $recipientId, $actorUserId);
        }
    }

    private function buildMessage(array $task, string $event): string
    {
        $frontendUrl = rtrim((string) (Config::app()['frontend_url'] ?? ''), '/');
        $taskUrl = $frontendUrl !== '' ? $frontendUrl . '/client/tasks/' . (int) $task['task_id'] : '';

        $lines = [
            'There is an update on your task in Client CRM Portal.',
            '',
            'Task ID: ' . (int) $task['task_id'],
            'Title: ' . (string) $task['task_title'],
            'Project: ' . (string) $task['project_name'],
            'Event: ' . str_replace('_', ' ', $event),
            '',
        ];

        if ($taskUrl !== '') {
            $lines[] = 'Open task: ' . $taskUrl;
            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    private function buildHeaders(): string
    {
        $appConfig = Config::app();
        $fromAddress = str_replace(["\r", "\n"], '', (string) ($appConfig['mail_from_address'] ?? 'noreply@localhost'));
        $fromName = str_replace(["\r", "\n"], '', trim((string) ($appConfig['mail_from_name'] ?? 'Client CRM Portal')));

        return "From: {$fromName} <{$fromAddress}>\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n";
    }

    private function taskContext(int $taskId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT t.id AS task_id,
                    t.title AS task_title,
                    p.name AS project_name,
                    c.id AS client_id
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
            "SELECT id, email
             FROM users
             WHERE client_id = :client_id
               AND role = 'client'
               AND is_active = 1"
        );
        $stmt->execute([':client_id' => $clientId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function statePath(int $taskId, int $userId): string
    {
        $dir = dirname(__DIR__, 2) . '/storage/cache/client-update-mail';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $key = hash('sha256', 'task:' . $taskId . '|user:' . $userId);
        return $dir . '/' . $key . '.json';
    }

    private function isCoolingDown(int $taskId, int $userId, int $cooldownSeconds): bool
    {
        $path = $this->statePath($taskId, $userId);
        if (!is_file($path)) {
            return false;
        }

        $raw = file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            return false;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return false;
        }

        $lastSentAt = (int) ($decoded['last_sent_at'] ?? 0);
        if ($lastSentAt <= 0) {
            return false;
        }

        return (time() - $lastSentAt) < $cooldownSeconds;
    }

    private function markSent(int $taskId, int $userId, int $actorUserId): void
    {
        $path = $this->statePath($taskId, $userId);
        $payload = json_encode([
            'task_id' => $taskId,
            'user_id' => $userId,
            'actor_user_id' => $actorUserId,
            'last_sent_at' => time(),
        ], JSON_UNESCAPED_SLASHES);

        if (!is_string($payload)) {
            return;
        }

        file_put_contents($path, $payload, LOCK_EX);
    }

    private function logMailFailure(string $reason, int $taskId, string $email): void
    {
        try {
            $logDir = dirname(__DIR__, 2) . '/storage/logs';
            if (!is_dir($logDir)) {
                mkdir($logDir, 0775, true);
            }

            $line = sprintf(
                "[%s] client_task_update_email_error: %s task_id=%d email=%s\n",
                date('c'),
                $reason,
                $taskId,
                $email
            );

            file_put_contents($logDir . '/app.log', $line, FILE_APPEND);
        } catch (Throwable) {
            // Never block request flow on logging failures.
        }
    }
}

