<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Policies\TaskPolicy;
use App\Services\NotificationService;
use App\Validators\ApiValidator;
use PDO;
use Throwable;

final class CommentController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot access comments for this task.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT c.id, c.task_id, c.user_id, c.body, c.created_at, c.updated_at,
                    u.name AS author_name, u.role AS author_role
             FROM comments c
             INNER JOIN users u ON u.id = c.user_id
             WHERE c.task_id = :task_id
             ORDER BY c.created_at DESC'
        );
        $stmt->execute([':task_id' => $taskId]);

        return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function store(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot comment on this task.');
        }

        $body = ApiValidator::requiredString($request->input('body'), 'body', 2000);

        $stmt = Database::connection()->prepare(
            'INSERT INTO comments (task_id, user_id, body)
             VALUES (:task_id, :user_id, :body)'
        );
        $stmt->execute([
            ':task_id' => $taskId,
            ':user_id' => (int) $user['id'],
            ':body' => $body,
        ]);

        if (($user['role'] ?? '') === 'admin') {
            try {
                (new NotificationService())->notifyClientUsersForTask(
                    $taskId,
                    (int) $user['id'],
                    'comment_added',
                    'New admin comment',
                    'Admin added a new comment to your task.'
                );
            } catch (Throwable) {
                // Notification errors must not block comment creation.
            }
        }

        return Response::json(['data' => ['id' => (int) Database::connection()->lastInsertId()]], 201);
    }
}
