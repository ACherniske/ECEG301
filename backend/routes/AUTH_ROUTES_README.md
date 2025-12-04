# Authentication Routes

User and driver authentication with JWT tokens.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/driver/login` | No | Driver login |
| POST | `/api/auth/driver/register` | No | Driver registration |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/change-password` | Yes | Change password |
| POST | `/api/auth/verify-token` | No | Validate token |

## Login Request

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

## Login Response

```json
{
  "user": {
    "id": "USR001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "staff",
    "organizationId": "ORG001"
  },
  "organization": {
    "id": "ORG001",
    "name": "Healthcare Organization"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Missing required fields |
| 401 | Invalid credentials |
| 500 | Server error |
