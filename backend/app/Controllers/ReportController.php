<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Validators\ApiValidator;
use PDO;

final class ReportController extends BaseController
{
    public function summary(Request $request, array $params): Response
    {
        unset($params);

        $user = $this->currentUser();

        $where = ['t.deleted_at IS NULL'];
        $bind = [];

        if (($user['role'] ?? '') !== 'admin') {
            $where[] = 'p.client_id = :client_id';
            $bind[':client_id'] = (int) $user['client_id'];
        } elseif ($request->query('client_id') !== null && $request->query('client_id') !== '') {
            $where[] = 'p.client_id = :client_id';
            $bind[':client_id'] = ApiValidator::requiredInt($request->query('client_id'), 'client_id');
        }

        if ($request->query('project_id') !== null && $request->query('project_id') !== '') {
            $where[] = 't.project_id = :project_id';
            $bind[':project_id'] = ApiValidator::requiredInt($request->query('project_id'), 'project_id');
        }

        $taskType = ApiValidator::optionalEnum($request->query('task_type'), 'task_type', ['bugfix', 'implementation', 'new_feature', 'maintenance']);
        if ($taskType !== null) {
            $where[] = 't.task_type = :task_type';
            $bind[':task_type'] = $taskType;
        }

        $invoiceStatus = ApiValidator::optionalEnum($request->query('invoice_status'), 'invoice_status', ['draft', 'sent', 'paid']);
        if ($invoiceStatus !== null) {
            $where[] = 't.invoice_status = :invoice_status';
            $bind[':invoice_status'] = $invoiceStatus;
        }

        $from = ApiValidator::optionalDate($request->query('from'), 'from');
        if ($from !== null) {
            $where[] = 'DATE(t.created_at) >= :from';
            $bind[':from'] = $from;
        }

        $to = ApiValidator::optionalDate($request->query('to'), 'to');
        if ($to !== null) {
            $where[] = 'DATE(t.created_at) <= :to';
            $bind[':to'] = $to;
        }

        $whereSql = implode(' AND ', $where);

        $summarySql = 'SELECT
            COALESCE(SUM(t.estimated_hours), 0) AS estimated_hours_total,
            COALESCE(SUM(
                CASE
                    WHEN t.actual_hours_override IS NOT NULL THEN t.actual_hours_override
                    ELSE COALESCE(tl.actual_hours, 0)
                END
            ), 0) AS actual_hours_total,
            COALESCE(SUM(COALESCE(t.estimated_hours, 0) * COALESCE(t.hourly_rate_override, 0)), 0) AS estimated_cost_total,
            COALESCE(SUM(
                (
                    CASE
                        WHEN t.actual_hours_override IS NOT NULL THEN t.actual_hours_override
                        ELSE COALESCE(tl.actual_hours, 0)
                    END
                ) * COALESCE(t.hourly_rate_override, 0)
            ), 0) AS actual_cost_total
            FROM tasks t
            INNER JOIN projects p ON p.id = t.project_id
            INNER JOIN clients c ON c.id = p.client_id
            LEFT JOIN (
                SELECT task_id, SUM(minutes)/60 AS actual_hours
                FROM time_logs
                GROUP BY task_id
            ) tl ON tl.task_id = t.id
            WHERE ' . $whereSql;

        $summaryStmt = Database::connection()->prepare($summarySql);
        $summaryStmt->execute($bind);
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $breakdownSql = 'SELECT
            p.client_id,
            c.name AS client_name,
            t.project_id,
            p.name AS project_name,
            t.task_type,
            COUNT(*) AS tasks_count,
            COALESCE(SUM(t.estimated_hours), 0) AS estimated_hours,
            COALESCE(SUM(
                CASE
                    WHEN t.actual_hours_override IS NOT NULL THEN t.actual_hours_override
                    ELSE COALESCE(tl.actual_hours, 0)
                END
            ), 0) AS actual_hours,
            COALESCE(SUM(COALESCE(t.estimated_hours, 0) * COALESCE(t.hourly_rate_override, 0)), 0) AS estimated_cost,
            COALESCE(SUM(
                (
                    CASE
                        WHEN t.actual_hours_override IS NOT NULL THEN t.actual_hours_override
                        ELSE COALESCE(tl.actual_hours, 0)
                    END
                ) * COALESCE(t.hourly_rate_override, 0)
            ), 0) AS actual_cost
            FROM tasks t
            INNER JOIN projects p ON p.id = t.project_id
            INNER JOIN clients c ON c.id = p.client_id
            LEFT JOIN (
                SELECT task_id, SUM(minutes)/60 AS actual_hours
                FROM time_logs
                GROUP BY task_id
            ) tl ON tl.task_id = t.id
            WHERE ' . $whereSql . '
            GROUP BY p.client_id, c.name, t.project_id, p.name, t.task_type
            ORDER BY c.name ASC, p.name ASC, t.task_type ASC';

        $breakdownStmt = Database::connection()->prepare($breakdownSql);
        $breakdownStmt->execute($bind);
        $breakdown = $breakdownStmt->fetchAll(PDO::FETCH_ASSOC);

        return Response::json([
            'data' => [
                'estimated_hours_total' => (float) ($summary['estimated_hours_total'] ?? 0),
                'actual_hours_total' => (float) ($summary['actual_hours_total'] ?? 0),
                'estimated_cost_total' => (float) ($summary['estimated_cost_total'] ?? 0),
                'actual_cost_total' => (float) ($summary['actual_cost_total'] ?? 0),
                'breakdown' => $breakdown,
            ],
        ]);
    }
}
