-- In-app notifications for client users

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  type ENUM(
    'task_updated',
    'task_status_changed',
    'comment_added',
    'attachment_added',
    'attachment_deleted',
    'timelog_added',
    'timelog_updated',
    'timelog_deleted'
  ) NOT NULL,
  title VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  data_json JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_client_created (client_id, created_at),
  INDEX idx_notifications_task_id (task_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_notifications_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
