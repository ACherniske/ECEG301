# Patients Routes Documentation

## Overview
This module provides access to patient information from the Electronic Health Record (EHR) system. It allows searching for patients and retrieving detailed patient information for ride scheduling and appointment management.

## Base Path
All patient routes are available at `/api/org/:orgId/patients/*`

## Authentication
All routes require authentication via JWT token in Authorization header: `Bearer <token>`

## API Endpoints

### 1. Search Patients
**GET** `/api/org/:orgId/patients/search`

Searches for patients within an organization based on various criteria.

**Path Parameters:**
- `orgId` (string) - The organization ID

**Query Parameters:**
- `query` (string, required) - Search term to match against patient information

**Headers:**
```
Authorization: Bearer <token>
```

**Request Example:**
```
GET /api/org/ORG001/patients/search?query=john
```

**Response:**
```json
[
  {
    "id": "PAT001",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1980-05-15",
    "phone": "(555) 123-4567",
    "address": "123 Main St, Anytown, ST 12345",
    "email": "john.doe@email.com"
  },
  {
    "id": "PAT002",
    "firstName": "Johnny",
    "lastName": "Smith",
    "dateOfBirth": "1975-08-22",
    "phone": "(555) 987-6543",
    "address": "456 Oak Ave, Anytown, ST 12345",
    "email": "johnny.smith@email.com"
  }
]
```

**Search Criteria:**
The search matches against:
- Patient ID (exact match)
- First name (partial match)
- Last name (partial match)
- Full name (partial match)
- Phone number (partial match)

**Search Features:**
- Case-insensitive search
- Partial text matching
- Organization-scoped results
- Returns all matching patients

**Error Responses:**
- `400` - Missing or empty search query
- `500` - Internal server error

### 2. Get Patient by ID
**GET** `/api/org/:orgId/patients/:patientId`

Retrieves detailed information for a specific patient.

**Path Parameters:**
- `orgId` (string) - The organization ID
- `patientId` (string) - The patient ID

**Headers:**
```
Authorization: Bearer <token>
```

**Request Example:**
```
GET /api/org/ORG001/patients/PAT001
```

**Response:**
```json
{
  "id": "PAT001",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-05-15",
  "phone": "(555) 123-4567",
  "address": "123 Main St, Anytown, ST 12345",
  "email": "john.doe@email.com"
}
```

**Error Responses:**
- `404` - Patient not found
- `500` - Internal server error

## Patient Data Structure

Patient information includes:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique patient identifier |
| firstName | string | Patient's first name |
| lastName | string | Patient's last name |
| dateOfBirth | string | Birth date (YYYY-MM-DD format) |
| phone | string | Contact phone number |
| address | string | Home address |
| email | string | Email address (for notifications) |

## Data Storage

Patient data is stored in Google Sheets with the following structure:

| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization ID |
| B | PatientId | Unique patient identifier |
| C | FirstName | Patient's first name |
| D | LastName | Patient's last name |
| E | DateOfBirth | Birth date |
| F | Phone | Contact phone number |
| G | Address | Home address |
| H | Email | Email address |

## Usage Examples

### Frontend Integration

```javascript
const orgId = 'ORG001'
const token = localStorage.getItem('authToken')

// Search for patients
const searchResponse = await fetch(`/api/org/${orgId}/patients/search?query=john`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const patients = await searchResponse.json()

// Get specific patient
const patientResponse = await fetch(`/api/org/${orgId}/patients/PAT001`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const patient = await patientResponse.json()
```

### Search Implementation

```javascript
// Implement live search with debouncing
const searchPatients = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return []
  
  try {
    const response = await fetch(`/api/org/${orgId}/patients/search?query=${encodeURIComponent(searchTerm)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.ok) {
      return await response.json()
    } else {
      console.error('Search failed:', response.statusText)
      return []
    }
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}
```

## Security Features

- Organization-scoped access control
- JWT authentication required
- Patient data privacy protection
- Input validation and sanitization

## Business Logic

### Search Optimization
- Minimum query length requirements help performance
- Case-insensitive matching improves usability
- Multiple field searching increases finding success
- Organization isolation ensures data privacy

### Patient Privacy
- Only authorized organization staff can access patient data
- Search results are limited to organization scope
- Patient data includes contact information for ride notifications

## Integration with Other Services

- **Rides Service**: Uses patient data for ride creation
- **Appointments Service**: Links patient information to appointments
- **Email Service**: Uses patient email for notifications

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing query)
- `404` - Not Found (patient doesn't exist)
- `500` - Internal Server Error

## Dependencies

- Google Sheets API (data storage)
- Express.js (routing)
- JWT authentication middleware
