# Organizations Routes

Healthcare organization management.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/organizations` | List all organizations (admin) |
| GET | `/api/organizations/:orgId` | Get organization details |
| POST | `/api/organizations` | Create organization (admin) |
| PUT | `/api/organizations/:orgId` | Update organization |

## Organization Object

```json
{
  "id": "ORG001",
  "name": "Metro Healthcare Network",
  "address": "123 Medical Center Dr",
  "phone": "(555) 123-4567",
  "email": "contact@metrohealthcare.com",
  "status": "active",
  "createdAt": "2023-12-01"
}
```

## Create Request

```json
{
  "name": "New Healthcare Org",
  "address": "789 Care Center Way",
  "phone": "(555) 456-7890",
  "email": "admin@newhealthcare.org"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 404 | Organization not found |
| 500 | Server error |
