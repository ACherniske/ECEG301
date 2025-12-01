# Organizations Routes Documentation

## Overview
This module manages healthcare organization information, including organization creation, retrieval, and administration. Organizations serve as the top-level entity for user and ride management within the system.

## Base Path
All organization routes are available at `/api/organizations/*`

## Authentication
All routes require authentication via JWT token in Authorization header: `Bearer <token>`

## API Endpoints

### 1. Get All Organizations
**GET** `/api/organizations`

Retrieves a list of all organizations in the system (admin access only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "ORG001",
    "name": "Metro Healthcare Network",
    "address": "123 Medical Center Dr, Anytown, ST 12345",
    "phone": "(555) 123-4567",
    "email": "contact@metrohealthcare.com",
    "status": "active",
    "createdAt": "2023-12-01"
  },
  {
    "id": "ORG002",
    "name": "Regional Medical Group",
    "address": "456 Health Plaza Blvd, Anytown, ST 12345",
    "phone": "(555) 987-6543",
    "email": "info@regionalmed.org",
    "status": "active",
    "createdAt": "2023-12-05"
  }
]
```

**Access Control:**
- Requires admin privileges (TODO: Implementation pending)
- System administrators only

### 2. Get Specific Organization
**GET** `/api/organizations/:orgId`

Retrieves detailed information for a specific organization.

**Path Parameters:**
- `orgId` (string) - The organization ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "ORG001",
  "name": "Metro Healthcare Network",
  "address": "123 Medical Center Dr, Anytown, ST 12345",
  "phone": "(555) 123-4567",
  "email": "contact@metrohealthcare.com",
  "status": "active",
  "createdAt": "2023-12-01"
}
```

**Error Responses:**
- `404` - Organization not found

### 3. Create New Organization
**POST** `/api/organizations`

Creates a new healthcare organization (admin access only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Healthcare Organization",
  "address": "789 Care Center Way, Anytown, ST 12345",
  "phone": "(555) 456-7890",
  "email": "admin@newhealthcare.org"
}
```

**Required Fields:**
- `name` (string) - Organization name

**Optional Fields:**
- `address` (string) - Organization address
- `phone` (string) - Contact phone number
- `email` (string) - Contact email address

**Response (Success):**
```json
{
  "id": "ORG003",
  "name": "New Healthcare Organization",
  "address": "789 Care Center Way, Anytown, ST 12345",
  "phone": "(555) 456-7890",
  "email": "admin@newhealthcare.org",
  "status": "active",
  "createdAt": "2024-01-10T09:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing organization name
- `500` - Internal server error

**Access Control:**
- Requires admin privileges (TODO: Implementation pending)
- System administrators only

## Organization Data Structure

Organization information includes:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique organization identifier |
| name | string | Organization name |
| address | string | Physical address |
| phone | string | Contact phone number |
| email | string | Contact email address |
| status | string | Organization status (active, inactive) |
| createdAt | string | Creation timestamp |

## Business Logic

### Organization Creation
- Auto-generates unique organization IDs
- Sets initial status to "active"
- Records creation timestamp
- Validates required name field

### Access Control
- Admin-only operations for organization management
- Organization-scoped data access for regular users
- Hierarchical permission structure

## Usage Examples

### Frontend Integration

```javascript
const token = localStorage.getItem('authToken')

// Get all organizations (admin only)
const orgsResponse = await fetch('/api/organizations', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const organizations = await orgsResponse.json()

// Get specific organization
const orgResponse = await fetch('/api/organizations/ORG001', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const organization = await orgResponse.json()

// Create new organization (admin only)
const createResponse = await fetch('/api/organizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'New Healthcare Organization',
    address: '789 Care Center Way, Anytown, ST 12345',
    phone: '(555) 456-7890',
    email: 'admin@newhealthcare.org'
  })
})
const newOrg = await createResponse.json()
```

## Integration with Other Services

### User Management
- Organizations contain users and staff
- User access is scoped to their organization
- Organization ID used for data isolation

### Ride Management
- All rides are organization-scoped
- Ride data filtered by organization membership
- Organization provides context for transportation services

### Authentication
- Organization information returned during login
- Organization ID used for authorization checks
- Multi-tenant architecture support

## Security Features

- JWT authentication required for all endpoints
- Organization data isolation
- Admin-only operations for system management
- Hierarchical access control structure

## Future Enhancements

### Pending Implementation
- Admin role checking for restricted operations
- Organization status management (active/inactive)
- Organization update capabilities
- Soft delete functionality

### Planned Features
- Organization settings and configuration
- Multi-organization user support
- Organization-specific branding
- Usage analytics and reporting

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created (new organization)
- `400` - Bad Request (missing required fields)
- `404` - Not Found (organization doesn't exist)
- `500` - Internal Server Error

## Dependencies

- organizationService (business logic)
- Express.js (routing)
- JWT authentication middleware
- Google Sheets API integration
