<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Validators\ApiValidator;
use PDO;

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

        $stmt = Database::connection()->prepare(
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

        return Response::json(['data' => ['id' => (int) Database::connection()->lastInsertId()]], 201);
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

        $stmt = Database::connection()->prepare('DELETE FROM clients WHERE id = :id');
        $stmt->execute([':id' => $id]);

        return Response::json(['data' => ['deleted' => $stmt->rowCount() > 0]]);
    }
}
