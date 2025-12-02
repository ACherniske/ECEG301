# Users Routes Documentation

## Overview
This module manages user accounts within organizations, including user creation, retrieval, and deactivation. All users belong to specific organizations and have role-based access control.

## Base Path
All user routes are available at `/api/org/:orgId/users/*`

## Authentication
All routes require authentication via JWT token in Authorization header: `Bearer <token>`

## API Endpoints

### 1. Get All Users for Organization
**GET** `/api/org/:orgId/users`

Retrieves all active users for a specific organization.

**Path Parameters:**
- `orgId` (string) - The organization ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "USR001",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "provider",
    "status": "active",
    "createdAt": "2023-12-01",
    "rowIndex": 2
  },
  {
    "id": "USR002",
    "email": "admin@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "admin",
    "status": "active",
    "createdAt": "2023-12-01",
    "rowIndex": 3
  }
]
```

**Response Details:**
- Returns only active users
- Users are filtered by organization ID
- `rowIndex` indicates the Google Sheets row for internal operations

### 2. Create New User
**POST** `/api/org/:orgId/users`

Creates a new user account for the specified organization.

**Path Parameters:**
- `orgId` (string) - The organization ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "securepassword",
  "role": "provider"
}
```

**Required Fields:**
- `email` (string) - User's email address
- `firstName` (string) - User's first name
- `lastName` (string) - User's last name
- `password` (string) - User's password

**Optional Fields:**
- `role` (string) - User role (defaults to "provider")

**Response (Success):**
```json
{
  "id": "USR003",
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "role": "provider",
  "status": "active"
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - User already exists with this email in the organization

### 3. Deactivate User
**DELETE** `/api/org/:orgId/users/:userId`

Deactivates a user account (soft delete - sets status to 'inactive').

**Path Parameters:**
- `orgId` (string) - The organization ID
- `userId` (string) - The user ID to deactivate

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "userId": "USR001"
}
```

**Error Responses:**
- `404` - User not found

## User Roles

The system supports different user roles:
- `provider` - Healthcare provider (default)
- `admin` - Organization administrator
- `staff` - Support staff

## Data Storage

User data is stored in Google Sheets with the following structure:

| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization ID |
| B | UserId | Unique user identifier |
| C | Email | User's email address |
| D | FirstName | User's first name |
| E | LastName | User's last name |
| F | Role | User role (provider, admin, staff) |
| G | Status | Account status (active, inactive) |
| H | CreatedAt | Account creation date |

## Business Logic

### User ID Generation
- New users get auto-incremented IDs within their organization
- IDs are organization-scoped (e.g., Org1 can have User1, Org2 can also have User1)

### Email Validation
- Email addresses are stored in lowercase
- Duplicate emails within the same organization are prevented

### Soft Delete
- Users are never permanently deleted
- Deactivation changes status to 'inactive'
- Inactive users are filtered out from GET requests

## Usage Examples

### Frontend Integration

```javascript
const orgId = 'ORG001'
const token = localStorage.getItem('authToken')

// Get all users for organization
const usersResponse = await fetch(`/api/org/${orgId}/users`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const users = await usersResponse.json()

// Create new user
const createResponse = await fetch(`/api/org/${orgId}/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    firstName: 'New',
    lastName: 'User',
    password: 'securepassword',
    role: 'provider'
  })
})
const newUser = await createResponse.json()

// Deactivate user
const deleteResponse = await fetch(`/api/org/${orgId}/users/USR001`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
const result = await deleteResponse.json()
```

## Security Considerations

- All routes require valid JWT authentication
- Users can only access data within their organization
- Password handling needs improvement (currently simplified)
- Email addresses are normalized to lowercase for consistency

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created (new user)
- `400` - Bad Request (missing fields)
- `404` - Not Found (user doesn't exist)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## Dependencies

- Google Sheets API (data storage)
- Express.js (routing)
- JWT authentication middleware
- Organization scoping logic
