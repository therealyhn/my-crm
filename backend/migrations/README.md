# Migrations

## Apply core schema

Run `001_create_core_schema.sql` against your MySQL database (for example `client_crm`).
Then run `002_create_notifications.sql`.
Then run `003_add_client_project_meta_fields.sql`.
Then run `004_drop_client_default_hourly_rate.sql`.

## Rollback core schema

Run `999_drop_core_schema.sql` only in development when you need to reset schema.
