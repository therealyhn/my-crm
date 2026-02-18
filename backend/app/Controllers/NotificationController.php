<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Validators\ApiValidator;
use PDO;

final class NotificationController extends BaseController
{
    public function index(Request $request, array $params): Response
    {
        unset($params);
        $user = $this->currentUser();
        $userId = (int) $user['id'];

        $limit = ApiValidator::optionalInt($request->query('limit'), 'limit', 1) ?? 20;
        $limit = min($limit, 100);

        $unreadOnlyRaw = $request->query('unread_only');
        $unreadOnly = is_string($unreadOnlyRaw)
            ? in_array(strtolower(trim($unreadOnlyRaw)), ['1', 'true', 'yes'], true)
            : (bool) $unreadOnlyRaw;

        $where = ['n.user_id = :user_id'];
        $bind = [':user_id' => $userId];

        if ($unreadOnly) {
            $where[] = 'n.is_read = 0';
        }

        $sql = 'SELECT n.id, n.task_id, n.actor_user_id, n.type, n.title, n.message, n.is_read, n.read_at, n.created_at
                FROM notifications n
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY n.created_at DESC
                LIMIT :limit';

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $unreadCountStmt = Database::connection()->prepare(
            'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = :user_id AND is_read = 0'
        );
        $unreadCountStmt->execute([':user_id' => $userId]);
        $unreadCountRow = $unreadCountStmt->fetch(PDO::FETCH_ASSOC);
        $unreadCount = (int) ($unreadCountRow['unread_count'] ?? 0);

        return Response::json([
            'data' => $rows,
            'meta' => [
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markAllRead(Request $request, array $params): Response
    {
        unset($request, $params);
        $user = $this->currentUser();

        $stmt = Database::connection()->prepare(
            'UPDATE notifications
             SET is_read = 1, read_at = NOW()
             WHERE user_id = :user_id AND is_read = 0'
        );
        $stmt->execute([':user_id' => (int) $user['id']]);

        return Response::json([
            'data' => [
                'updated' => $stmt->rowCount(),
            ],
        ]);
    }
}
