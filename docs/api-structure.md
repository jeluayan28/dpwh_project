# API Structure

This is the clean REST-style backend structure for the document tracking system.

## Folder structure

```text
app/
  api/
    admin/
      departments/
        route.ts
        [id]/
          route.ts
      roles/
        route.ts
      users/
        route.ts
        [id]/
          route.ts
    documents/
      route.ts
      [id]/
        route.ts
        chain-of-custody/
          route.ts
        logs/
          route.ts
        movements/
          route.ts
        status/
          route.ts
    internal/
      documents/
        mark-overdue/
          route.ts
    logs/
      [logId]/
        route.ts
    movements/
      [movementId]/
        route.ts
    status-history/
      [statusId]/
        route.ts

services/
  adminService.ts
  documentService.ts
  overdueService.ts
```

## Documents

### `GET /api/documents`

Response:

```json
{
  "data": [
    {
      "document_id": 1,
      "tracking_num": 202604280001,
      "title": "Budget Request",
      "status": "pending",
      "is_urgent": false,
      "created_at": "2026-04-28T08:00:00.000Z",
      "type": "Memo",
      "file_url": "https://..."
    }
  ]
}
```

### `POST /api/documents`

Request:

```json
{
  "title": "Budget Request",
  "type": "Memo",
  "status": "pending",
  "is_urgent": false,
  "file_url": "https://..."
}
```

Response:

```json
{
  "data": {
    "document_id": 1,
    "tracking_num": 202604280001,
    "title": "Budget Request",
    "status": "pending",
    "is_urgent": false,
    "created_at": "2026-04-28T08:00:00.000Z",
    "type": "Memo",
    "file_url": "https://..."
  }
}
```

### `GET /api/documents/:id`
### `PATCH /api/documents/:id`
### `DELETE /api/documents/:id`

## Document logs

### `GET /api/documents/:id/logs`
### `POST /api/documents/:id/logs`

Request:

```json
{
  "from_department_id": 1,
  "to_department_id": 2,
  "released_by": 5,
  "received_by": 8,
  "remarks": "Forwarded for review",
  "date_received": "2026-04-28T10:00:00.000Z",
  "date_released": "2026-04-28T09:55:00.000Z",
  "status": "in_transit"
}
```

### `PATCH /api/logs/:logId`
### `DELETE /api/logs/:logId`

Compatibility aliases:

- `GET /api/documents/:id/movements`
- `POST /api/documents/:id/movements`
- `PATCH /api/movements/:movementId`
- `DELETE /api/movements/:movementId`

## Chain of custody

### `GET /api/documents/:id/chain-of-custody`

Response:

```json
{
  "data": {
    "document": {
      "document_id": 1,
      "tracking_num": 202604280001,
      "title": "Budget Request",
      "status": "in_transit",
      "is_urgent": false,
      "created_at": "2026-04-28T08:00:00.000Z",
      "type": "Memo",
      "file_url": "https://..."
    },
    "current_department_id": 2,
    "current_department_name": "Accounting",
    "latest_status": "in_transit",
    "status_history": [],
    "logs": []
  }
}
```

## Status history

### `GET /api/documents/:id/status`
### `POST /api/documents/:id/status`

Request:

```json
{
  "status": "completed",
  "updated_at": "2026-04-28T12:30:00.000Z"
}
```

### `PATCH /api/status-history/:statusId`
### `DELETE /api/status-history/:statusId`

## Admin

### Users

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

Create request:

```json
{
  "name": "Maria Santos",
  "email": "maria@dpwh.gov.ph",
  "password": "secret123",
  "status": true,
  "role_id": 2,
  "department_id": 3
}
```

### Roles

- `GET /api/admin/roles`

### Departments

- `GET /api/admin/departments`
- `POST /api/admin/departments`
- `PATCH /api/admin/departments/:id`
- `DELETE /api/admin/departments/:id`

## Internal / scheduled

### `POST /api/internal/documents/mark-overdue`

Used by a scheduler or cron job to mark documents as overdue when they stay in a department for more than 3 days.
