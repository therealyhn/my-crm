# Migrations

## Apply core schema

Run `001_create_core_schema.sql` against your MySQL database (for example `client_crm`).

## Rollback core schema

Run `999_drop_core_schema.sql` only in development when you need to reset schema.
