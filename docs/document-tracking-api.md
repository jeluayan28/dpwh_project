# Document Tracking API

## Documents

- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`

### Create document body

```json
{
  "title": "Budget Realignment Request",
  "type": "Payroll",
  "status": "pending",
  "is_urgent": false,
  "created_by": 7,
  "initial_department_id": 2,
  "received_by": 7,
  "initial_remarks": "Initial document intake."
}
```

The server generates `tracking_num` automatically, inserts into `Documents`, writes the first row in `Document_Status_History`, and optionally creates the first `Document_Logs` entry when `initial_department_id` is provided.

## Document Logs

- `GET /api/documents/:id/logs`
- `POST /api/documents/:id/logs`
- `PATCH /api/logs/:logId`
- `DELETE /api/logs/:logId`

Compatibility aliases:
- `GET /api/documents/:id/movements`
- `POST /api/documents/:id/movements`
- `PATCH /api/movements/:movementId`
- `DELETE /api/movements/:movementId`

### Record log body

```json
{
  "from_department_id": 2,
  "to_department_id": 5,
  "date_received": "2026-04-21T13:20:00.000Z",
  "date_released": "2026-04-21T13:15:00.000Z",
  "remarks": "Sent to accounting for budget validation.",
  "released_by": 7,
  "received_by": 12,
  "status": "in_transit"
}
```

Each log entry is stored in `Document_Logs`. If `status` is provided, the API also updates `Documents.status` and appends a row to `Document_Status_History`.

## Status History

- `GET /api/documents/:id/status`
- `POST /api/documents/:id/status`
- `PATCH /api/status-history/:statusId`
- `DELETE /api/status-history/:statusId`

### Record status body

```json
{
  "status": "completed",
  "updated_at": "2026-04-21T14:00:00.000Z"
}
```

Each status change is stored in `Document_Status_History` and also syncs `Documents.status`.

## Chain Of Custody

- `GET /api/documents/:id/chain-of-custody`

This returns:
- the `Documents` row
- the derived current department from the latest `Document_Logs.to_department_id`
- the full ordered `Document_Logs` history with department and user names
- the full `Document_Status_History`
