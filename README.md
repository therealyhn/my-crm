<div align="center">

# Client CRM Portal

### Self-hosted client task portal with hourly billing workflows

*Clean PHP + MySQL backend, React + Vite + Tailwind frontend, production-ready for Hostinger*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![PHP](https://img.shields.io/badge/PHP-8%2B-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Overview](#overview) • [Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [API](#api-endpoints) • [Deployment](#deployment)

</div>

---

## Overview

Client CRM Portal is a multi-tenant system for managing website/app work requests between admin and clients.

The app is built as a self-hosted solution (no paid SaaS dependency) with:

- secure session auth (HTTP-only cookies + CSRF)
- strict ownership checks in backend policies
- hourly billing fields and reporting
- comments, attachments, time logs, and in-app updates
- separated admin and client experiences

---

## Features

### Client Area
- Login with client credentials
- Create tasks on own projects
- Add comments and upload attachments
- Track task status, updates, and history
- View unread notifications when admin updates tasks
- Change own password

### Admin Area
- Manage clients (create, edit, credentials, delete)
- Manage projects (create, edit, status)
- Full task management and status workflow
- Billing controls per task (estimated hours, rate override, invoice status)
- Time log management
- Reports summary with filters (date, client, project, task type, invoice status)

### Security
- Session-based auth with server-side role checks
- Backend ownership policies:
  - `TaskPolicy`
  - `ProjectPolicy`
  - `ClientPolicy`
- CSRF protection on state-changing endpoints
- PDO prepared statements only
- upload validation (size + MIME)
- protected storage and blocked direct access to sensitive files

---

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Component-first structure (`layout`, `tasks`, `comments`, `timelogs`, `ui`, etc.)
- API layer modules under `src/lib/api`

### Backend
- Clean PHP (custom mini-framework style)
- MySQL + PDO
- REST JSON API
- Router + middleware + controllers + services + policies

### Infrastructure
- Apache (XAMPP local / Hostinger in production)
- Local file storage for uploads: `backend/storage/uploads`

---

## Project Structure

```text
my-crm/
├── src/                         # React frontend
│   ├── components/
│   │   ├── layout/
│   │   ├── tasks/
│   │   ├── comments/
│   │   ├── timelogs/
│   │   ├── attachments/
│   │   └── ui/
│   ├── pages/
│   │   ├── admin/
│   │   └── client/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── constants/
│   │   └── utils/
│   └── main.jsx
│
├── backend/
│   ├── app/
│   │   ├── Core/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Policies/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   └── Validators/
│   ├── routes/
│   │   └── api.php
│   ├── migrations/
│   ├── public/
│   ├── storage/
│   │   ├── uploads/
│   │   ├── logs/
│   │   └── cache/
│   ├── bootstrap.php
│   └── .env.example
│
├── public/                      # Frontend static assets
├── .env.example                 # Frontend env template
└── README.md
```

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of backend API |

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `APP_ENV` | `local` or `production` |
| `APP_DEBUG` | Enable detailed errors in development |
| `APP_URL` | Backend base URL |
| `FRONTEND_URL` | Frontend origin URL |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | Database connection |
| `SESSION_COOKIE` / `SESSION_SECURE` / `SESSION_SAMESITE` | Session cookie settings |
| `CORS_ALLOWED_ORIGIN` | Allowed frontend origin |
| `MAX_UPLOAD_MB` | Upload limit in MB |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | Sender metadata |
| `NOTIFY_NEW_TASK_EMAILS` | Comma-separated admin email recipients |
| `AUTH_LOGIN_WINDOW_SECONDS` / `AUTH_LOGIN_MAX_ATTEMPTS` / `AUTH_LOGIN_LOCKOUT_SECONDS` | Login throttle |

---

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/csrf-token`

### Clients (Admin)
- `GET /api/clients`
- `GET /api/clients/{id}/overview`
- `POST /api/clients`
- `PUT /api/clients/{id}`
- `PUT /api/clients/{id}/credentials`
- `DELETE /api/clients/{id}`

### Projects
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects` (admin)
- `PUT /api/projects/{id}` (admin)
- `DELETE /api/projects/{id}` (admin)

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/{id}`
- `PUT /api/tasks/{id}`
- `PATCH /api/tasks/{id}/status` (admin)
- `DELETE /api/tasks/{id}` (admin)

### Comments
- `GET /api/tasks/{id}/comments`
- `POST /api/tasks/{id}/comments`

### Attachments
- `GET /api/tasks/{id}/attachments`
- `POST /api/tasks/{id}/attachments`
- `GET /api/attachments/{id}`
- `DELETE /api/attachments/{id}`

### Time Logs
- `GET /api/tasks/{id}/timelogs`
- `POST /api/tasks/{id}/timelogs`
- `PUT /api/timelogs/{id}`
- `DELETE /api/timelogs/{id}`

### Reports & Notifications
- `GET /api/reports/summary`
- `GET /api/notifications`
- `POST /api/notifications/read-all`

---

## Security Checklist

- Do not commit `.env`, `.env.hostinger`, DB dumps, logs, uploads
- Keep `backend/.htaccess` enabled to block sensitive files
- Force HTTPS in production
- Set `SESSION_SECURE=true` on production
- Use strong passwords for admin and DB user
- Rotate exposed credentials immediately if leaked
- Backup DB and `storage/uploads` regularly

---

## Deployment

### Recommended (Hostinger shared hosting)
1. Build frontend:
   - `npm run build`
2. Upload `dist/` to subdomain web root (for example `crm.jovanljusic.com`).
3. Upload backend folder to subfolder (for example `/backend`).
4. Set production env files on server:
   - frontend `.env` at build time with production API URL
   - `backend/.env` with production DB credentials
5. Import migrations into production DB.
6. Verify:
   - `/backend/api/health`
   - login flow
   - file upload and download
   - CSRF-protected actions

---

## Notes

- Attachments are stored on disk in `backend/storage/uploads`, not in DB binary blobs.
- DB stores metadata only (name, MIME type, size, uploader, timestamps).
- Notifications are aggregated per task for cleaner client dashboard updates.

---

## License

Private project.
