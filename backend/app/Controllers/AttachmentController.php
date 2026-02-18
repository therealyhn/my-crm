<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Policies\TaskPolicy;
use App\Services\NotificationService;
use App\Validators\ApiValidator;
use PDO;
use Throwable;

final class AttachmentController extends BaseController
{
    public function indexByTask(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot access attachments for this task.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, task_id, uploaded_by_user_id, original_name, mime_type, size_bytes, created_at
             FROM attachments
             WHERE task_id = :task_id
             ORDER BY created_at DESC'
        );
        $stmt->execute([':task_id' => $taskId]);

        return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function store(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot upload to this task.');
        }

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new HttpException(422, 'validation_error', 'File is required.');
        }

        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new HttpException(422, 'upload_error', 'Upload failed.');
        }

        $maxBytes = Config::app()['max_upload_mb'] * 1024 * 1024;
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new HttpException(422, 'validation_error', 'File size is invalid.');
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new HttpException(422, 'upload_error', 'Invalid upload source.');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? (string) finfo_file($finfo, $tmpName) : '';
        if ($finfo) {
            finfo_close($finfo);
        }

        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            'text/plain' => 'txt',
            'application/zip' => 'zip',
        ];

        if (!isset($allowed[$mime])) {
            throw new HttpException(422, 'validation_error', 'File type is not allowed.');
        }

        $ext = $allowed[$mime];
        $storedName = bin2hex(random_bytes(20)) . '.' . $ext;

        $uploadDir = dirname(__DIR__, 2) . '/storage/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $destination = $uploadDir . '/' . $storedName;
        if (!move_uploaded_file($tmpName, $destination)) {
            throw new HttpException(500, 'upload_error', 'Could not save uploaded file.');
        }

        $originalName = trim((string) ($file['name'] ?? 'file'));
        $safeOriginal = preg_replace('/[^a-zA-Z0-9._ -]/', '_', $originalName) ?: 'file.' . $ext;

        $stmt = Database::connection()->prepare(
            'INSERT INTO attachments (task_id, uploaded_by_user_id, original_name, stored_name, storage_path, mime_type, size_bytes)
             VALUES (:task_id, :uploaded_by_user_id, :original_name, :stored_name, :storage_path, :mime_type, :size_bytes)'
        );
        $stmt->execute([
            ':task_id' => $taskId,
            ':uploaded_by_user_id' => (int) $user['id'],
            ':original_name' => $safeOriginal,
            ':stored_name' => $storedName,
            ':storage_path' => 'storage/uploads/' . $storedName,
            ':mime_type' => $mime,
            ':size_bytes' => $size,
        ]);

        if (($user['role'] ?? '') === 'admin') {
            try {
                (new NotificationService())->notifyClientUsersForTask(
                    $taskId,
                    (int) $user['id'],
                    'attachment_added',
                    'New attachment',
                    'Admin uploaded a new attachment to your task.'
                );
            } catch (Throwable) {
                // Notification errors must not block attachment upload.
            }
        }

        return Response::json(['data' => ['id' => (int) Database::connection()->lastInsertId()]], 201);
    }

    public function show(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $attachmentId = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare(
            'SELECT a.id, a.task_id, a.uploaded_by_user_id, a.original_name, a.stored_name, a.storage_path, a.mime_type, a.size_bytes
             FROM attachments a
             WHERE a.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $attachmentId]);
        $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($attachment)) {
            throw new HttpException(404, 'not_found', 'Attachment not found.');
        }

        if (!(new TaskPolicy())->canAccessTask($user, (int) $attachment['task_id'])) {
            throw new HttpException(403, 'forbidden', 'You cannot access this attachment.');
        }

        $path = dirname(__DIR__, 2) . '/storage/uploads/' . $attachment['stored_name'];
        if (!is_file($path)) {
            throw new HttpException(404, 'not_found', 'Attachment file is missing.');
        }

        $content = file_get_contents($path);
        if ($content === false) {
            throw new HttpException(500, 'server_error', 'Could not read attachment file.');
        }

        return new Response(
            $content,
            200,
            [
                'Content-Type' => (string) $attachment['mime_type'],
                'Content-Disposition' => 'attachment; filename="' . str_replace('"', '', (string) $attachment['original_name']) . '"',
            ]
        );
    }

    public function destroy(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $attachmentId = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare(
            'SELECT a.id, a.task_id, a.uploaded_by_user_id, a.stored_name
             FROM attachments a
             WHERE a.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $attachmentId]);
        $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($attachment)) {
            throw new HttpException(404, 'not_found', 'Attachment not found.');
        }

        $isAdmin = ($user['role'] ?? '') === 'admin';
        $isOwner = (int) $attachment['uploaded_by_user_id'] === (int) $user['id'];

        if (!$isAdmin && !$isOwner) {
            throw new HttpException(403, 'forbidden', 'You cannot delete this attachment.');
        }

        if (!(new TaskPolicy())->canAccessTask($user, (int) $attachment['task_id'])) {
            throw new HttpException(403, 'forbidden', 'You cannot access this attachment.');
        }

        $deleteStmt = Database::connection()->prepare('DELETE FROM attachments WHERE id = :id');
        $deleteStmt->execute([':id' => $attachmentId]);

        $path = dirname(__DIR__, 2) . '/storage/uploads/' . $attachment['stored_name'];
        if (is_file($path)) {
            @unlink($path);
        }

        if ($deleteStmt->rowCount() > 0 && $isAdmin) {
            try {
                (new NotificationService())->notifyClientUsersForTask(
                    (int) $attachment['task_id'],
                    (int) $user['id'],
                    'attachment_deleted',
                    'Attachment removed',
                    'Admin removed an attachment from your task.'
                );
            } catch (Throwable) {
                // Notification errors must not block attachment deletion.
            }
        }

        return Response::json(['data' => ['deleted' => $deleteStmt->rowCount() > 0]]);
    }
}
