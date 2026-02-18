<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use App\Services\NotificationService;
use App\Services\TaskNotificationService;
use App\Validators\ApiValidator;
use PDO;
use Throwable;

final class TaskController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();

        $where = ['t.deleted_at IS NULL'];
        $bind = [];

        if (($user['role'] ?? '') !== 'admin') {
            $where[] = 'p.client_id = :client_id';
            $bind[':client_id'] = (int) $user['client_id'];
        }

        $map = [
            'status' => 't.status',
            'project_id' => 't.project_id',
            'priority' => 't.priority',
            'task_type' => 't.task_type',
            'invoice_status' => 't.invoice_status',
        ];

        foreach ($map as $queryKey => $column) {
            $value = $request->query($queryKey);
            if ($value !== null && $value !== '') {
                $param = ':' . $queryKey;
                $where[] = $column . ' = ' . $param;
                $bind[$param] = (string) $value;
            }
        }

        $q = trim((string) ($request->query('q') ?? ''));
        if ($q !== '') {
            $where[] = '(t.title LIKE :q OR t.description LIKE :q)';
            $bind[':q'] = '%' . $q . '%';
        }

        $dateFrom = ApiValidator::optionalDate($request->query('from'), 'from');
        if ($dateFrom !== null) {
            $where[] = 'DATE(t.created_at) >= :from';
            $bind[':from'] = $dateFrom;
        }

        $dateTo = ApiValidator::optionalDate($request->query('to'), 'to');
        if ($dateTo !== null) {
            $where[] = 'DATE(t.created_at) <= :to';
            $bind[':to'] = $dateTo;
        }

        $sql = 'SELECT t.id, t.project_id, p.client_id, c.name AS client_name, p.name AS project_name,
                       t.created_by_user_id, t.assigned_to_user_id,
                       t.title, t.description, t.status, t.priority, t.task_type,
                       t.billable, t.estimated_hours, t.hourly_rate_override, t.actual_hours_override,
                       t.invoice_status, t.opened_at, t.closed_at, t.created_at, t.updated_at
                FROM tasks t
                INNER JOIN projects p ON p.id = t.project_id
                INNER JOIN clients c ON c.id = p.client_id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY t.created_at DESC';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($bind);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return Response::json(['data' => $rows]);
    }

    public function show(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        if (!(new TaskPolicy())->canAccessTask($user, $id)) {
            throw new HttpException(403, 'forbidden', 'You cannot access this task.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT t.id, t.project_id, p.client_id, c.name AS client_name, p.name AS project_name,
                    t.created_by_user_id, t.assigned_to_user_id,
                    t.title, t.description, t.status, t.priority, t.task_type,
                    t.billable, t.estimated_hours, t.hourly_rate_override, t.actual_hours_override,
                    t.invoice_status, t.opened_at, t.closed_at, t.created_at, t.updated_at
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             INNER JOIN clients c ON c.id = p.client_id
             WHERE t.id = :id AND t.deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($task)) {
            throw new HttpException(404, 'not_found', 'Task not found.');
        }

        return Response::json(['data' => $task]);
    }

    public function store(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();

        $projectId = ApiValidator::requiredInt($request->input('project_id'), 'project_id');

        if (!(new ProjectPolicy())->canAccessProject($user, $projectId)) {
            throw new HttpException(403, 'forbidden', 'You cannot create tasks for this project.');
        }

        $title = ApiValidator::requiredString($request->input('title'), 'title', 220);
        $description = ApiValidator::optionalString($request->input('description'), 'description', 65535);
        $priority = ApiValidator::optionalEnum($request->input('priority'), 'priority', ['low', 'medium', 'high', 'urgent']) ?? 'medium';
        $allowedTaskTypes = ($user['role'] ?? '') === 'admin'
            ? ['bugfix', 'implementation', 'new_feature', 'maintenance']
            : ['bugfix', 'implementation', 'maintenance'];
        $taskType = ApiValidator::requiredEnum($request->input('task_type'), 'task_type', $allowedTaskTypes);
        $billable = ApiValidator::optionalBool($request->input('billable'), 'billable');

        $status = ($user['role'] ?? '') === 'admin'
            ? (ApiValidator::optionalEnum($request->input('status'), 'status', ['draft', 'open', 'in_progress', 'waiting_client', 'done', 'cancelled']) ?? 'open')
            : 'draft';

        $estimatedHours = ($user['role'] ?? '') === 'admin'
            ? ApiValidator::optionalDecimal($request->input('estimated_hours'), 'estimated_hours', 0)
            : null;

        $hourlyRateOverride = ($user['role'] ?? '') === 'admin'
            ? ApiValidator::optionalDecimal($request->input('hourly_rate_override'), 'hourly_rate_override', 0)
            : null;

        $invoiceStatus = ($user['role'] ?? '') === 'admin'
            ? (ApiValidator::optionalEnum($request->input('invoice_status'), 'invoice_status', ['draft', 'sent', 'paid']) ?? 'draft')
            : 'draft';

        $assignedTo = ($user['role'] ?? '') === 'admin'
            ? ApiValidator::optionalInt($request->input('assigned_to_user_id'), 'assigned_to_user_id', 1)
            : null;

        $stmt = Database::connection()->prepare(
            'INSERT INTO tasks
                (project_id, created_by_user_id, assigned_to_user_id, title, description, status, priority, task_type,
                 billable, estimated_hours, hourly_rate_override, invoice_status, opened_at)
             VALUES
                (:project_id, :created_by_user_id, :assigned_to_user_id, :title, :description, :status, :priority, :task_type,
                 :billable, :estimated_hours, :hourly_rate_override, :invoice_status, NOW())'
        );
        $stmt->execute([
            ':project_id' => $projectId,
            ':created_by_user_id' => (int) $user['id'],
            ':assigned_to_user_id' => $assignedTo,
            ':title' => $title,
            ':description' => $description,
            ':status' => $status,
            ':priority' => $priority,
            ':task_type' => $taskType,
            ':billable' => $billable === null ? 1 : ($billable ? 1 : 0),
            ':estimated_hours' => $estimatedHours,
            ':hourly_rate_override' => $hourlyRateOverride,
            ':invoice_status' => $invoiceStatus,
        ]);

        $taskId = (int) Database::connection()->lastInsertId();

        try {
            (new TaskNotificationService())->sendTaskCreated($taskId);
        } catch (Throwable) {
            // Notification errors must not block task creation.
        }

        if (($user['role'] ?? '') === 'admin') {
            try {
                (new NotificationService())->notifyClientUsersForTask(
                    $taskId,
                    (int) $user['id'],
                    'task_updated',
                    'New task created',
                    'Admin created a new task on your project.'
                );
            } catch (Throwable) {
                // Notification errors must not block task creation.
            }
        }

        return Response::json(['data' => ['id' => $taskId]], 201);
    }

    public function update(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        if (!(new TaskPolicy())->canAccessTask($user, $id)) {
            throw new HttpException(403, 'forbidden', 'You cannot update this task.');
        }

        $existingStmt = Database::connection()->prepare(
            'SELECT id, status FROM tasks WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $existingStmt->execute([':id' => $id]);
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($existing)) {
            throw new HttpException(404, 'not_found', 'Task not found.');
        }

        if (($user['role'] ?? '') === 'admin') {
            $allowedFields = [
                'assigned_to_user_id', 'title', 'description', 'status', 'priority', 'task_type', 'billable',
                'estimated_hours', 'hourly_rate_override', 'actual_hours_override', 'invoice_status', 'closed_at'
            ];
        } else {
            if (($existing['status'] ?? '') !== 'draft') {
                throw new HttpException(403, 'forbidden', 'Client can edit only draft tasks.');
            }
            $allowedFields = ['title', 'description', 'priority'];
        }

        $input = $request->json();
        $updates = [];
        $bind = [':id' => $id];

        foreach ($allowedFields as $field) {
            if (!array_key_exists($field, $input)) {
                continue;
            }

            $param = ':' . $field;
            $updates[] = $field . ' = ' . $param;

            switch ($field) {
                case 'assigned_to_user_id':
                    $bind[$param] = ApiValidator::optionalInt($input[$field], $field, 1);
                    break;
                case 'title':
                    $bind[$param] = ApiValidator::requiredString($input[$field], $field, 220);
                    break;
                case 'description':
                    $bind[$param] = ApiValidator::optionalString($input[$field], $field, 65535);
                    break;
                case 'status':
                    $bind[$param] = ApiValidator::requiredEnum($input[$field], $field, ['draft', 'open', 'in_progress', 'waiting_client', 'done', 'cancelled']);
                    break;
                case 'priority':
                    $bind[$param] = ApiValidator::requiredEnum($input[$field], $field, ['low', 'medium', 'high', 'urgent']);
                    break;
                case 'task_type':
                    $bind[$param] = ApiValidator::requiredEnum($input[$field], $field, ['bugfix', 'implementation', 'new_feature', 'maintenance']);
                    break;
                case 'billable':
                    $bind[$param] = ApiValidator::optionalBool($input[$field], $field) ? 1 : 0;
                    break;
                case 'estimated_hours':
                case 'hourly_rate_override':
                case 'actual_hours_override':
                    $bind[$param] = ApiValidator::optionalDecimal($input[$field], $field, 0);
                    break;
                case 'invoice_status':
                    $bind[$param] = ApiValidator::requiredEnum($input[$field], $field, ['draft', 'sent', 'paid']);
                    break;
                case 'closed_at':
                    $bind[$param] = $input[$field] === null || $input[$field] === '' ? null : (string) $input[$field];
                    break;
            }
        }

        if ($updates === []) {
            return Response::json(['data' => ['updated' => false]]);
        }

        $sql = 'UPDATE tasks SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($bind);

        $updated = $stmt->rowCount() > 0;

        if ($updated && ($user['role'] ?? '') === 'admin') {
            try {
                if (array_key_exists('status', $input)) {
                    $statusValue = (string) ($bind[':status'] ?? '');
                    (new NotificationService())->notifyClientUsersForTask(
                        $id,
                        (int) $user['id'],
                        'task_status_changed',
                        'Task status changed',
                        $statusValue !== ''
                            ? 'Admin changed task status to "' . $statusValue . '".'
                            : 'Admin changed task status.'
                    );
                } else {
                    (new NotificationService())->notifyClientUsersForTask(
                        $id,
                        (int) $user['id'],
                        'task_updated',
                        'Task updated',
                        'Admin updated your task details.'
                    );
                }
            } catch (Throwable) {
                // Notification errors must not block task update.
            }
        }

        return Response::json(['data' => ['updated' => $updated]]);
    }

    public function updateStatus(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');
        $status = ApiValidator::requiredEnum($request->input('status'), 'status', ['draft', 'open', 'in_progress', 'waiting_client', 'done', 'cancelled']);

        $stmt = Database::connection()->prepare(
            'UPDATE tasks
             SET status = :status,
                 closed_at = CASE WHEN :status_done = 1 THEN NOW() ELSE closed_at END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([
            ':id' => $id,
            ':status' => $status,
            ':status_done' => $status === 'done' ? 1 : 0,
        ]);

        $updated = $stmt->rowCount() > 0;

        if ($updated) {
            try {
                (new NotificationService())->notifyClientUsersForTask(
                    $id,
                    (int) $user['id'],
                    'task_status_changed',
                    'Task status changed',
                    'Admin changed task status to "' . $status . '".'
                );
            } catch (Throwable) {
                // Notification errors must not block status update.
            }
        }

        return Response::json(['data' => ['updated' => $updated]]);
    }

    public function destroy(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare('UPDATE tasks SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([':id' => $id]);

        return Response::json(['data' => ['deleted' => $stmt->rowCount() > 0]]);
    }
}
