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
            'SELECT id, name, company_name, email, phone, instagram, domain_main,
                    hosting_provider, hosting_panel_url, hosting_login, hosting_password,
                    github_url, cms_org_name, cms_org_id, cms_project_name, cms_url, cms_app_id,
                    notes, default_hourly_rate, is_active, created_at, updated_at
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
        $instagram = ApiValidator::optionalString($request->input('instagram'), 'instagram', 120);
        $domainMain = ApiValidator::optionalString($request->input('domain_main'), 'domain_main', 255);
        $hostingProvider = ApiValidator::optionalString($request->input('hosting_provider'), 'hosting_provider', 120);
        $hostingPanelUrl = ApiValidator::optionalString($request->input('hosting_panel_url'), 'hosting_panel_url', 500);
        $hostingLogin = ApiValidator::optionalString($request->input('hosting_login'), 'hosting_login', 190);
        $hostingPassword = ApiValidator::optionalString($request->input('hosting_password'), 'hosting_password', 255);
        $githubUrl = ApiValidator::optionalString($request->input('github_url'), 'github_url', 500);
        $cmsOrgName = ApiValidator::optionalString($request->input('cms_org_name'), 'cms_org_name', 190);
        $cmsOrgId = ApiValidator::optionalString($request->input('cms_org_id'), 'cms_org_id', 120);
        $cmsProjectName = ApiValidator::optionalString($request->input('cms_project_name'), 'cms_project_name', 190);
        $cmsUrl = ApiValidator::optionalString($request->input('cms_url'), 'cms_url', 500);
        $cmsAppId = ApiValidator::optionalString($request->input('cms_app_id'), 'cms_app_id', 190);
        $notes = ApiValidator::optionalString($request->input('notes'), 'notes', 65535);
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
                'INSERT INTO clients (
                    name, company_name, email, phone, instagram, domain_main,
                    hosting_provider, hosting_panel_url, hosting_login, hosting_password,
                    github_url, cms_org_name, cms_org_id, cms_project_name, cms_url, cms_app_id, notes,
                    default_hourly_rate, is_active
                 )
                 VALUES (
                    :name, :company_name, :email, :phone, :instagram, :domain_main,
                    :hosting_provider, :hosting_panel_url, :hosting_login, :hosting_password,
                    :github_url, :cms_org_name, :cms_org_id, :cms_project_name, :cms_url, :cms_app_id, :notes,
                    :default_hourly_rate, :is_active
                 )'
            );
            $stmt->execute([
                ':name' => $name,
                ':company_name' => $companyName,
                ':email' => $email,
                ':phone' => $phone,
                ':instagram' => $instagram,
                ':domain_main' => $domainMain,
                ':hosting_provider' => $hostingProvider,
                ':hosting_panel_url' => $hostingPanelUrl,
                ':hosting_login' => $hostingLogin,
                ':hosting_password' => $hostingPassword,
                ':github_url' => $githubUrl,
                ':cms_org_name' => $cmsOrgName,
                ':cms_org_id' => $cmsOrgId,
                ':cms_project_name' => $cmsProjectName,
                ':cms_url' => $cmsUrl,
                ':cms_app_id' => $cmsAppId,
                ':notes' => $notes,
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

    public function overview(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $clientStmt = Database::connection()->prepare(
            'SELECT id, name, company_name, email, phone, instagram, domain_main,
                    hosting_provider, hosting_panel_url, hosting_login, hosting_password,
                    github_url, cms_org_name, cms_org_id, cms_project_name, cms_url, cms_app_id,
                    notes, default_hourly_rate, is_active, created_at, updated_at
             FROM clients
             WHERE id = :id
             LIMIT 1'
        );
        $clientStmt->execute([':id' => $id]);
        $client = $clientStmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($client)) {
            throw new HttpException(404, 'not_found', 'Client not found.');
        }

        $projectsStmt = Database::connection()->prepare(
            'SELECT id, client_id, name, description, domain_main, github_url,
                    cms_org_name, cms_org_id, cms_project_name, cms_url, cms_app_id, notes,
                    status, start_date, due_date, created_at, updated_at
             FROM projects
             WHERE client_id = :client_id
             ORDER BY created_at DESC'
        );
        $projectsStmt->execute([':client_id' => $id]);
        $projects = $projectsStmt->fetchAll(PDO::FETCH_ASSOC);

        $tasksStmt = Database::connection()->prepare(
            'SELECT t.id, t.project_id, p.name AS project_name, t.title, t.description, t.status, t.priority,
                    t.task_type, t.billable, t.invoice_status, t.created_at, t.updated_at
             FROM tasks t
             INNER JOIN projects p ON p.id = t.project_id
             WHERE p.client_id = :client_id AND t.deleted_at IS NULL
             ORDER BY t.created_at DESC'
        );
        $tasksStmt->execute([':client_id' => $id]);
        $tasks = $tasksStmt->fetchAll(PDO::FETCH_ASSOC);

        $credentialsStmt = Database::connection()->prepare(
            "SELECT id, email, is_active, created_at, updated_at, last_login_at
             FROM users
             WHERE client_id = :client_id AND role = 'client'
             ORDER BY created_at ASC
             LIMIT 1"
        );
        $credentialsStmt->execute([':client_id' => $id]);
        $credentials = $credentialsStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        return Response::json([
            'data' => [
                'client' => $client,
                'projects' => $projects,
                'tasks' => $tasks,
                'credentials' => $credentials,
            ],
        ]);
    }

    public function updateCredentials(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $clientId = ApiValidator::requiredInt($params['id'] ?? null, 'id');
        $loginEmail = ApiValidator::requiredString($request->input('login_email'), 'login_email', 190);
        $newPassword = ApiValidator::optionalString($request->input('new_password'), 'new_password', 255);
        $isActive = ApiValidator::optionalBool($request->input('is_active'), 'is_active');

        if (!filter_var($loginEmail, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation_error', 'login_email must be a valid email.');
        }

        if ($newPassword !== null && mb_strlen($newPassword) < 8) {
            throw new HttpException(422, 'validation_error', 'new_password must be at least 8 characters.');
        }

        $pdo = Database::connection();

        $clientUserStmt = $pdo->prepare(
            "SELECT id, email
             FROM users
             WHERE client_id = :client_id AND role = 'client'
             ORDER BY created_at ASC
             LIMIT 1"
        );
        $clientUserStmt->execute([':client_id' => $clientId]);
        $clientUser = $clientUserStmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($clientUser)) {
            throw new HttpException(404, 'not_found', 'Client login user not found.');
        }

        $userId = (int) $clientUser['id'];

        $existsStmt = $pdo->prepare(
            'SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1'
        );
        $existsStmt->execute([
            ':email' => $loginEmail,
            ':id' => $userId,
        ]);
        if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
            throw new HttpException(409, 'conflict', 'A user with this login_email already exists.');
        }

        $updates = ['email = :email'];
        $bind = [
            ':id' => $userId,
            ':email' => $loginEmail,
        ];

        if ($newPassword !== null && $newPassword !== '') {
            $updates[] = 'password_hash = :password_hash';
            $bind[':password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
        }

        if ($isActive !== null) {
            $updates[] = 'is_active = :is_active';
            $bind[':is_active'] = $isActive ? 1 : 0;
        }

        $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);

        return Response::json([
            'data' => [
                'updated' => $stmt->rowCount() > 0,
            ],
        ]);
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
        $instagram = ApiValidator::optionalString($request->input('instagram'), 'instagram', 120);
        $domainMain = ApiValidator::optionalString($request->input('domain_main'), 'domain_main', 255);
        $hostingProvider = ApiValidator::optionalString($request->input('hosting_provider'), 'hosting_provider', 120);
        $hostingPanelUrl = ApiValidator::optionalString($request->input('hosting_panel_url'), 'hosting_panel_url', 500);
        $hostingLogin = ApiValidator::optionalString($request->input('hosting_login'), 'hosting_login', 190);
        $hostingPassword = ApiValidator::optionalString($request->input('hosting_password'), 'hosting_password', 255);
        $githubUrl = ApiValidator::optionalString($request->input('github_url'), 'github_url', 500);
        $cmsOrgName = ApiValidator::optionalString($request->input('cms_org_name'), 'cms_org_name', 190);
        $cmsOrgId = ApiValidator::optionalString($request->input('cms_org_id'), 'cms_org_id', 120);
        $cmsProjectName = ApiValidator::optionalString($request->input('cms_project_name'), 'cms_project_name', 190);
        $cmsUrl = ApiValidator::optionalString($request->input('cms_url'), 'cms_url', 500);
        $cmsAppId = ApiValidator::optionalString($request->input('cms_app_id'), 'cms_app_id', 190);
        $notes = ApiValidator::optionalString($request->input('notes'), 'notes', 65535);
        $defaultHourlyRate = ApiValidator::optionalDecimal($request->input('default_hourly_rate'), 'default_hourly_rate', 0) ?? 0;
        $isActive = ApiValidator::optionalBool($request->input('is_active'), 'is_active');

        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException(422, 'validation_error', 'email must be a valid email.');
        }

        $stmt = Database::connection()->prepare(
            'UPDATE clients
             SET name = :name,
                 company_name = :company_name,
                 email = :email,
                 phone = :phone,
                 instagram = :instagram,
                 domain_main = :domain_main,
                 hosting_provider = :hosting_provider,
                 hosting_panel_url = :hosting_panel_url,
                 hosting_login = :hosting_login,
                 hosting_password = :hosting_password,
                 github_url = :github_url,
                 cms_org_name = :cms_org_name,
                 cms_org_id = :cms_org_id,
                 cms_project_name = :cms_project_name,
                 cms_url = :cms_url,
                 cms_app_id = :cms_app_id,
                 notes = :notes,
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
            ':instagram' => $instagram,
            ':domain_main' => $domainMain,
            ':hosting_provider' => $hostingProvider,
            ':hosting_panel_url' => $hostingPanelUrl,
            ':hosting_login' => $hostingLogin,
            ':hosting_password' => $hostingPassword,
            ':github_url' => $githubUrl,
            ':cms_org_name' => $cmsOrgName,
            ':cms_org_id' => $cmsOrgId,
            ':cms_project_name' => $cmsProjectName,
            ':cms_url' => $cmsUrl,
            ':cms_app_id' => $cmsAppId,
            ':notes' => $notes,
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
