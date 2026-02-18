<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Policies\ProjectPolicy;
use App\Validators\ApiValidator;
use PDO;

final class ProjectController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();

        $where = [];
        $bind = [];

        if (($user['role'] ?? '') !== 'admin') {
            $where[] = 'p.client_id = :client_id';
            $bind[':client_id'] = (int) $user['client_id'];
        } elseif ($request->query('client_id') !== null && $request->query('client_id') !== '') {
            $where[] = 'p.client_id = :client_id';
            $bind[':client_id'] = ApiValidator::requiredInt($request->query('client_id'), 'client_id');
        }

        $sql = 'SELECT p.id, p.client_id, p.name, p.description, p.domain_main, p.github_url,
                       p.cms_org_name, p.cms_org_id, p.cms_project_name, p.cms_url, p.cms_app_id, p.notes,
                       p.status, p.start_date, p.due_date, p.created_at, p.updated_at,
                       c.name AS client_name
                FROM projects p
                INNER JOIN clients c ON c.id = p.client_id';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY p.created_at DESC';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($bind);

        return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public function show(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        if (!(new ProjectPolicy())->canAccessProject($user, $id)) {
            throw new HttpException(403, 'forbidden', 'You cannot access this project.');
        }

        $stmt = Database::connection()->prepare(
            'SELECT p.id, p.client_id, p.name, p.description, p.domain_main, p.github_url,
                    p.cms_org_name, p.cms_org_id, p.cms_project_name, p.cms_url, p.cms_app_id, p.notes,
                    p.status, p.start_date, p.due_date, p.created_at, p.updated_at,
                    c.name AS client_name
             FROM projects p
             INNER JOIN clients c ON c.id = p.client_id
             WHERE p.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($project)) {
            throw new HttpException(404, 'not_found', 'Project not found.');
        }

        return Response::json(['data' => $project]);
    }

    public function store(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $clientId = ApiValidator::requiredInt($request->input('client_id'), 'client_id');
        $name = ApiValidator::requiredString($request->input('name'), 'name', 190);
        $description = ApiValidator::optionalString($request->input('description'), 'description', 65535);
        $domainMain = ApiValidator::optionalString($request->input('domain_main'), 'domain_main', 255);
        $githubUrl = ApiValidator::optionalString($request->input('github_url'), 'github_url', 500);
        $cmsOrgName = ApiValidator::optionalString($request->input('cms_org_name'), 'cms_org_name', 190);
        $cmsOrgId = ApiValidator::optionalString($request->input('cms_org_id'), 'cms_org_id', 120);
        $cmsProjectName = ApiValidator::optionalString($request->input('cms_project_name'), 'cms_project_name', 190);
        $cmsUrl = ApiValidator::optionalString($request->input('cms_url'), 'cms_url', 500);
        $cmsAppId = ApiValidator::optionalString($request->input('cms_app_id'), 'cms_app_id', 190);
        $notes = ApiValidator::optionalString($request->input('notes'), 'notes', 65535);
        $status = ApiValidator::optionalEnum($request->input('status'), 'status', ['active', 'on_hold', 'archived']) ?? 'active';
        $startDate = ApiValidator::optionalDate($request->input('start_date'), 'start_date');
        $dueDate = ApiValidator::optionalDate($request->input('due_date'), 'due_date');

        $stmt = Database::connection()->prepare(
            'INSERT INTO projects
                (client_id, name, description, domain_main, github_url, cms_org_name, cms_org_id, cms_project_name, cms_url, cms_app_id, notes, status, start_date, due_date)
             VALUES
                (:client_id, :name, :description, :domain_main, :github_url, :cms_org_name, :cms_org_id, :cms_project_name, :cms_url, :cms_app_id, :notes, :status, :start_date, :due_date)'
        );
        $stmt->execute([
            ':client_id' => $clientId,
            ':name' => $name,
            ':description' => $description,
            ':domain_main' => $domainMain,
            ':github_url' => $githubUrl,
            ':cms_org_name' => $cmsOrgName,
            ':cms_org_id' => $cmsOrgId,
            ':cms_project_name' => $cmsProjectName,
            ':cms_url' => $cmsUrl,
            ':cms_app_id' => $cmsAppId,
            ':notes' => $notes,
            ':status' => $status,
            ':start_date' => $startDate,
            ':due_date' => $dueDate,
        ]);

        return Response::json(['data' => ['id' => (int) Database::connection()->lastInsertId()]], 201);
    }

    public function update(Request $request, array $params): Response
    {
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');
        $clientId = ApiValidator::requiredInt($request->input('client_id'), 'client_id');
        $name = ApiValidator::requiredString($request->input('name'), 'name', 190);
        $description = ApiValidator::optionalString($request->input('description'), 'description', 65535);
        $domainMain = ApiValidator::optionalString($request->input('domain_main'), 'domain_main', 255);
        $githubUrl = ApiValidator::optionalString($request->input('github_url'), 'github_url', 500);
        $cmsOrgName = ApiValidator::optionalString($request->input('cms_org_name'), 'cms_org_name', 190);
        $cmsOrgId = ApiValidator::optionalString($request->input('cms_org_id'), 'cms_org_id', 120);
        $cmsProjectName = ApiValidator::optionalString($request->input('cms_project_name'), 'cms_project_name', 190);
        $cmsUrl = ApiValidator::optionalString($request->input('cms_url'), 'cms_url', 500);
        $cmsAppId = ApiValidator::optionalString($request->input('cms_app_id'), 'cms_app_id', 190);
        $notes = ApiValidator::optionalString($request->input('notes'), 'notes', 65535);
        $status = ApiValidator::optionalEnum($request->input('status'), 'status', ['active', 'on_hold', 'archived']) ?? 'active';
        $startDate = ApiValidator::optionalDate($request->input('start_date'), 'start_date');
        $dueDate = ApiValidator::optionalDate($request->input('due_date'), 'due_date');

        $stmt = Database::connection()->prepare(
            'UPDATE projects
             SET client_id = :client_id,
                 name = :name,
                 description = :description,
                 domain_main = :domain_main,
                 github_url = :github_url,
                 cms_org_name = :cms_org_name,
                 cms_org_id = :cms_org_id,
                 cms_project_name = :cms_project_name,
                 cms_url = :cms_url,
                 cms_app_id = :cms_app_id,
                 notes = :notes,
                 status = :status,
                 start_date = :start_date,
                 due_date = :due_date
             WHERE id = :id'
        );
        $stmt->execute([
            ':id' => $id,
            ':client_id' => $clientId,
            ':name' => $name,
            ':description' => $description,
            ':domain_main' => $domainMain,
            ':github_url' => $githubUrl,
            ':cms_org_name' => $cmsOrgName,
            ':cms_org_id' => $cmsOrgId,
            ':cms_project_name' => $cmsProjectName,
            ':cms_url' => $cmsUrl,
            ':cms_app_id' => $cmsAppId,
            ':notes' => $notes,
            ':status' => $status,
            ':start_date' => $startDate,
            ':due_date' => $dueDate,
        ]);

        return Response::json(['data' => ['updated' => $stmt->rowCount() > 0]]);
    }

    public function destroy(Request $request, array $params): Response
    {
        unset($request);
        $user = $this->currentUser();
        $this->ensureAdmin($user);

        $id = ApiValidator::requiredInt($params['id'] ?? null, 'id');

        $stmt = Database::connection()->prepare('DELETE FROM projects WHERE id = :id');
        $stmt->execute([':id' => $id]);

        return Response::json(['data' => ['deleted' => $stmt->rowCount() > 0]]);
    }
}
