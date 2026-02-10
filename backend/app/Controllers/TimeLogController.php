<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Policies\TaskPolicy;
use App\Validators\ApiValidator;
use PDO;

final class TimeLogController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot access time logs for this task.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT tl.id, tl.task_id, tl.user_id, tl.log_date, tl.minutes, tl.note, tl.created_at, tl.updated_at,
                    u.name AS user_name
             FROM time_logs tl
             INNER JOIN users u ON u.id = tl.user_id
             WHERE tl.task_id = :task_id
             ORDER BY tl.log_date DESC, tl.created_at DESC'
        );
        $stmt->execute([':task_id' => $taskId]);

        return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function store(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $taskId = ApiValidator::requiredInt($params['id'] ?? null, 'task_id');

        if (!(new TaskPolicy())->canAccessTask($user, $taskId)) {
            throw new HttpException(403, 'forbidden', 'You cannot log time for this task.');
        }

        $logDate = ApiValidator::optionalDate($request->input('log_date'), 'log_date') ?? gmdate('Y-m-d');
        $minutes = ApiValidator::requiredInt($request->input('minutes'), 'minutes', 1);
        $note = ApiValidator::optionalString($request->input('note'), 'note', 2000);

        $stmt = Database::connection()->prepare(
            'INSERT INTO time_logs (task_id, user_id, log_date, minutes, note)
             VALUES (:task_id, :user_id, :log_date, :minutes, :note)'
        );
        $stmt->execute([
            ':task_id' => $taskId,
            ':user_id' => (int) $user['id'],
            ':log_date' => $logDate,
            ':minutes' => $minutes,
            ':note' => $note,
        ]);

        return Response::json(['data' => ['id' => (int) Database::connection()->lastInsertId()]], 201);
    }

    public function update(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare(
            'SELECT tl.id, tl.task_id, tl.user_id
             FROM time_logs tl
             WHERE tl.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $timeLog = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($timeLog)) {
            throw new HttpException(404, 'not_found', 'Time log not found.');
        }

        if (!(new TaskPolicy())->canAccessTask($user, (int) $timeLog['task_id'])) {
            throw new HttpException(403, 'forbidden', 'You cannot access this time log.');
        }

        $isAdmin = ($user['role'] ?? '') === 'admin';
        $isOwner = (int) $timeLog['user_id'] === (int) $user['id'];
        if (!$isAdmin && !$isOwner) {
            throw new HttpException(403, 'forbidden', 'You cannot edit this time log.');
        }

        $logDate = ApiValidator::optionalDate($request->input('log_date'), 'log_date');
        $minutes = ApiValidator::optionalInt($request->input('minutes'), 'minutes', 1);
        $note = ApiValidator::optionalString($request->input('note'), 'note', 2000);

        $updates = [];
        $bind = [':id' => $id];

        if ($logDate !== null) {
            $updates[] = 'log_date = :log_date';
            $bind[':log_date'] = $logDate;
        }
        if ($minutes !== null) {
            $updates[] = 'minutes = :minutes';
            $bind[':minutes'] = $minutes;
        }
        if (array_key_exists('note', $request->json())) {
            $updates[] = 'note = :note';
            $bind[':note'] = $note;
        }

        if ($updates === []) {
            return Response::json(['data' => ['updated' => false]]);
        }

        $sql = 'UPDATE time_logs SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
        $updateStmt = Database::connection()->prepare($sql);
        $updateStmt->execute($bind);

        return Response::json(['data' => ['updated' => $updateStmt->rowCount() > 0]]);
    }

    public function destroy(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare(
            'SELECT tl.id, tl.task_id, tl.user_id
             FROM time_logs tl
             WHERE tl.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $timeLog = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($timeLog)) {
            throw new HttpException(404, 'not_found', 'Time log not found.');
        }

        if (!(new TaskPolicy())->canAccessTask($user, (int) $timeLog['task_id'])) {
            throw new HttpException(403, 'forbidden', 'You cannot access this time log.');
        }

        $isAdmin = ($user['role'] ?? '') === 'admin';
        $isOwner = (int) $timeLog['user_id'] === (int) $user['id'];
        if (!$isAdmin && !$isOwner) {
            throw new HttpException(403, 'forbidden', 'You cannot delete this time log.');
        }

        $deleteStmt = Database::connection()->prepare('DELETE FROM time_logs WHERE id = :id');
        $deleteStmt->execute([':id' => $id]);

        return Response::json(['data' => ['deleted' => $deleteStmt->rowCount() > 0]]);
    }
}
