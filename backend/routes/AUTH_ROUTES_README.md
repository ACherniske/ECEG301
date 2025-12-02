# Authentication Routes Documentation

## Overview
This module handles user authentication, login/logout functionality, password management, and token verification for the transportation system.

## Base Path
All authentication routes are available at `/api/auth/*`

## Authentication
- Some routes require authentication via JWT token in Authorization header: `Bearer <token>`
- Public routes: `/login`, `/verify-token`
- Protected routes: `/logout`, `/me`, `/change-password`

## API Endpoints

### 1. User Login
**POST** `/api/auth/login`

Authenticates a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (Success):**
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
    "name": "Healthcare Organization",
    "address": "123 Main St",
    "phone": "(555) 123-4567",
    "email": "contact@org.com",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials

### 2. User Logout
**POST** `/api/auth/logout`

Logs out the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 3. Get Current User
**GET** `/api/auth/me`

Retrieves information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "USR001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "staff",
    "organizationId": "ORG001"
  }
}
```

### 4. Change Password
**POST** `/api/auth/change-password`

Changes the password for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Missing current or new password
- `401` - Invalid current password

### 5. Verify Token
**POST** `/api/auth/verify-token`

Verifies if a JWT token is valid and not expired.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Valid Token):**
```json
{
  "valid": true,
  "user": {
    "id": "USR001",
    "organizationId": "ORG001"
  }
}
```

**Response (Invalid Token):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

## Security Features

- Password hashing using bcrypt
- JWT token generation and verification
- Token expiration handling
- Organization-level user isolation
- Secure password change with current password verification

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid credentials/token)
- `500` - Internal Server Error

## Usage Examples

### Frontend Integration

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const { user, organization, token } = await loginResponse.json()

// Store token for future requests
localStorage.setItem('authToken', token)

// Get current user info
const userResponse = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Change password
const changePasswordResponse = await fetch('/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    currentPassword: 'oldpassword',
    newPassword: 'newpassword'
  })
})

// Logout
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Dependencies

- bcrypt (password hashing)
- jsonwebtoken (JWT handling)
- Express.js (routing)
- organizationService (organization management)
- userService (user management)
