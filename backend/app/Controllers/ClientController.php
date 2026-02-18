<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Validators\ApiValidator;
use PDO;
use Throwable;

final class ClientController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($request, $params);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $rows = Database::connection()->query(
            'SELECT id, name, company_name, email, phone, default_hourly_rate, is_active, created_at, updated_at
             FROM clients
             ORDER BY created_at DESC'
        )->fetchAll(PDO::FETCH_ASSOC);

        return Response::json(['data' => $rows]);
    }

    public function store(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $name = ApiValidator::requiredString($request->input('name'), 'name', 150);
        $companyName = ApiValidator::optionalString($request->input('company_name'), 'company_name', 190);
        $email = ApiValidator::optionalString($request->input('email'), 'email', 190);
        $phone = ApiValidator::optionalString($request->input('phone'), 'phone', 50);
        $defaultHourlyRate = ApiValidator::optionalDecimal($request->input('default_hourly_rate'), 'default_hourly_rate', 0) ?? 0;
        $isActive = ApiValidator::optionalBool($request->input('is_active'), 'is_active');
        $loginEmail = ApiValidator::requiredString($request->input('login_email'), 'login_email', 190);
        $loginPassword = ApiValidator::requiredString($request->input('login_password'), 'login_password', 255);
        $loginName = ApiValidator::optionalString($request->input('login_name'), 'login_name', 150) ?? ($name . ' User');

        if (!filter_var($loginEmail, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation_error', 'login_email must be a valid email.');
        }

        if (mb_strlen($loginPassword) < 6) {
            throw new HttpException(422, 'validation_error', 'login_password must be at least 6 characters.');
        }

        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation_error', 'email must be a valid email.');
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();

        try {
            $existsStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $existsStmt->execute([':email' => $loginEmail]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
                throw new HttpException(409, 'conflict', 'A user with this login_email already exists.');
            }

            $stmt = $pdo->prepare(
                'INSERT INTO clients (name, company_name, email, phone, default_hourly_rate, is_active)
                 VALUES (:name, :company_name, :email, :phone, :default_hourly_rate, :is_active)'
            );
            $stmt->execute([
                ':name' => $name,
                ':company_name' => $companyName,
                ':email' => $email,
                ':phone' => $phone,
                ':default_hourly_rate' => number_format($defaultHourlyRate, 2, '.', ''),
                ':is_active' => $isActive === null ? 1 : ($isActive ? 1 : 0),
            ]);

            $clientId = (int) $pdo->lastInsertId();

            $userStmt = $pdo->prepare(
                'INSERT INTO users (client_id, name, email, password_hash, role, is_active)
                 VALUES (:client_id, :name, :email, :password_hash, :role, :is_active)'
            );
            $userStmt->execute([
                ':client_id' => $clientId,
                ':name' => $loginName,
                ':email' => $loginEmail,
                ':password_hash' => password_hash($loginPassword, PASSWORD_DEFAULT),
                ':role' => 'client',
                ':is_active' => $isActive === null ? 1 : ($isActive ? 1 : 0),
            ]);

            $userId = (int) $pdo->lastInsertId();
            $pdo->commit();

            return Response::json(['data' => ['id' => $clientId, 'user_id' => $userId]], 201);
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }

    public function update(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');
        $name = ApiValidator::requiredString($request->input('name'), 'name', 150);
        $companyName = ApiValidator::optionalString($request->input('company_name'), 'company_name', 190);
        $email = ApiValidator::optionalString($request->input('email'), 'email', 190);
        $phone = ApiValidator::optionalString($request->input('phone'), 'phone', 50);
        $defaultHourlyRate = ApiValidator::optionalDecimal($request->input('default_hourly_rate'), 'default_hourly_rate', 0) ?? 0;
        $isActive = ApiValidator::optionalBool($request->input('is_active'), 'is_active');

        $stmt = Database::connection()->prepare(
            'UPDATE clients
             SET name = :name,
                 company_name = :company_name,
                 email = :email,
                 phone = :phone,
                 default_hourly_rate = :default_hourly_rate,
                 is_active = :is_active
             WHERE id = :id'
        );
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':company_name' => $companyName,
            ':email' => $email,
            ':phone' => $phone,
            ':default_hourly_rate' => number_format($defaultHourlyRate, 2, '.', ''),
            ':is_active' => $isActive === null ? 1 : ($isActive ? 1 : 0),
        ]);

        return Response::json(['data' => ['updated' => $stmt->rowCount() > 0]]);
    }

    public function destroy(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $pdo = Database::connection();
        $attachmentFileNames = [];

        try {
            $pdo->beginTransaction();

            $clientExistsStmt = $pdo->prepare('SELECT id FROM clients WHERE id = :id LIMIT 1');
            $clientExistsStmt->execute([':id' => $id]);
            $clientExists = $clientExistsStmt->fetch(PDO::FETCH_ASSOC);
            if (!is_array($clientExists)) {
                $pdo->rollBack();
                return Response::json(['data' => ['deleted' => false]]);
            }

            $taskIdsStmt = $pdo->prepare(
                'SELECT t.id
                 FROM tasks t
                 INNER JOIN projects p ON p.id = t.project_id
                 WHERE p.client_id = :client_id'
            );
            $taskIdsStmt->execute([':client_id' => $id]);
            $taskIds = array_map(
                static fn (array $row): int => (int) $row['id'],
                $taskIdsStmt->fetchAll(PDO::FETCH_ASSOC)
            );

            if ($taskIds !== []) {
                $taskPlaceholders = implode(',', array_fill(0, count($taskIds), '?'));

                $attachmentFilesStmt = $pdo->prepare(
                    "SELECT stored_name FROM attachments WHERE task_id IN ($taskPlaceholders)"
                );
                $attachmentFilesStmt->execute($taskIds);
                $attachmentFileNames = array_values(array_filter(array_map(
                    static fn (array $row): string => (string) ($row['stored_name'] ?? ''),
                    $attachmentFilesStmt->fetchAll(PDO::FETCH_ASSOC)
                )));

                $commentsStmt = $pdo->prepare("DELETE FROM comments WHERE task_id IN ($taskPlaceholders)");
                $commentsStmt->execute($taskIds);

                $timeLogsStmt = $pdo->prepare("DELETE FROM time_logs WHERE task_id IN ($taskPlaceholders)");
                $timeLogsStmt->execute($taskIds);

                $attachmentsStmt = $pdo->prepare("DELETE FROM attachments WHERE task_id IN ($taskPlaceholders)");
                $attachmentsStmt->execute($taskIds);

                $tasksStmt = $pdo->prepare("DELETE FROM tasks WHERE id IN ($taskPlaceholders)");
                $tasksStmt->execute($taskIds);
            }

            $projectsStmt = $pdo->prepare('DELETE FROM projects WHERE client_id = :client_id');
            $projectsStmt->execute([':client_id' => $id]);

            $usersStmt = $pdo->prepare('DELETE FROM users WHERE client_id = :client_id');
            $usersStmt->execute([':client_id' => $id]);

            $clientStmt = $pdo->prepare('DELETE FROM clients WHERE id = :id');
            $clientStmt->execute([':id' => $id]);
            $deleted = $clientStmt->rowCount() > 0;

            $pdo->commit();

            if ($deleted && $attachmentFileNames !== []) {
                $uploadDir = dirname(__DIR__, 2) . '/storage/uploads';
                foreach ($attachmentFileNames as $fileName) {
                    $path = $uploadDir . '/' . $fileName;
                    if (is_file($path)) {
                        @unlink($path);
                    }
                }
            }
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw new HttpException(500, 'server_error', 'Failed to delete client and related data.');
        }

        return Response::json(['data' => ['deleted' => $deleted]]);
    }
}
