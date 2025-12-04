# Users Routes

Organization user account management.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/org/:orgId/users` | List organization users |
| POST | `/api/org/:orgId/users` | Create new user |
| DELETE | `/api/org/:orgId/users/:userId` | Deactivate user |

## User Object

```json
{
  "id": "USR001",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "provider",
  "status": "active",
  "createdAt": "2023-12-01"
}
```

## Create User Request

```json
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "securepassword",
  "role": "provider"
}
```

## Roles

| Role | Description |
|------|-------------|
| `admin` | Full organization access |
| `provider` | Standard staff access |
| `staff` | Limited access |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Missing required fields / Email exists |
| 404 | User not found |
| 500 | Server error |
