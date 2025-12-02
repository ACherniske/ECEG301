# Rides Routes Documentation

## Overview
This module manages ride requests for patient transportation to medical appointments. It handles ride creation, status updates, driver assignment, and email notifications with comprehensive validation and business logic.

## Base Path
All ride routes are available at `/api/org/:orgId/rides/*`

## Authentication
All routes require authentication via JWT token in Authorization header: `Bearer <token>`

## API Endpoints

### 1. Get All Rides for Organization
**GET** `/api/org/:orgId/rides`

Retrieves all rides for a specific organization.

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
    "orgId": "ORG001",
    "id": "RIDE001",
    "patientName": "John Doe",
    "patientId": "PAT001",
    "appointmentDate": "2024-01-15",
    "appointmentId": "APPT001",
    "pickupTime": "09:00",
    "roundTrip": true,
    "appointmentTime": "10:00",
    "providerLocation": "123 Medical Center Dr",
    "status": "pending",
    "notes": "Wheelchair accessible vehicle needed",
    "pickupLocation": "456 Patient St",
    "driverId": "DRV001",
    "driverName": "Driver Smith",
    "driverPlate": "ABC123",
    "driverCar": "Toyota Camry",
    "rowIndex": 2
  }
]
```

**Response Details:**
- Returns only rides for the specified organization
- Includes driver assignment information when available
- `rowIndex` indicates Google Sheets row for updates

### 2. Create New Ride
**POST** `/api/org/:orgId/rides`

Creates a new ride request with automatic validation and email notification.

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
  "patientId": "PAT001",
  "patientName": "John Doe",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "appointmentId": "APPT001",
  "providerLocation": "123 Medical Center Dr",
  "pickupLocation": "456 Patient St",
  "roundTrip": true,
  "notes": "Wheelchair accessible vehicle needed",
  "driverId": "DRV001",
  "driverName": "Driver Smith",
  "driverPlate": "ABC123",
  "driverCar": "Toyota Camry"
}
```

**Required Fields:**
- `patientId` (string) - Patient identifier
- `patientName` (string) - Patient's full name
- `appointmentDate` (string) - Appointment date (YYYY-MM-DD format)
- `appointmentTime` (string) - Appointment time (HH:MM format)

**Optional Fields:**
- `appointmentId` (string) - Appointment identifier
- `providerLocation` (string) - Healthcare provider address
- `pickupLocation` (string) - Patient pickup address
- `roundTrip` (boolean) - Whether return trip is needed
- `notes` (string) - Special instructions or requirements
- `driverId` (string) - Assigned driver ID
- `driverName` (string) - Assigned driver name
- `driverPlate` (string) - Driver's license plate
- `driverCar` (string) - Driver's vehicle description

**Response (Success):**
```json
{
  "id": "RIDE002",
  "orgId": "ORG001",
  "patientId": "PAT001",
  "patientName": "John Doe",
  "patientEmail": "patient@email.com",
  "appointmentDate": "2024-01-15",
  "appointmentId": "APPT001",
  "appointmentTime": "10:00",
  "providerLocation": "123 Medical Center Dr",
  "pickupLocation": "456 Patient St",
  "roundTrip": true,
  "notes": "Wheelchair accessible vehicle needed",
  "status": "pending",
  "confirmationToken": "abc123def456",
  "emailSent": true,
  "emailMessageId": "msg123",
  "confirmationUrl": "https://example.com/confirm/abc123def456",
  "createdAt": "2024-01-10T09:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing required fields or past appointment date
- `409` - Duplicate ride already exists for this appointment

**Business Logic:**
- Validates appointment is not in the past
- Checks for existing rides for same patient/appointment
- Generates unique ride ID within organization
- Creates confirmation token for email verification
- Sends email notification to patient if email available
- Sets initial status to "pending"

### 3. Update Ride Status
**PATCH** `/api/org/:orgId/rides/:rideId/status`

Updates the status of a specific ride.

**Path Parameters:**
- `orgId` (string) - The organization ID
- `rideId` (string) - The ride ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "confirmed",
  "rowIndex": 3
}
```

**Required Fields:**
- `status` (string) - New ride status
- `rowIndex` (number) - Google Sheets row index

**Valid Status Values:**
- `pending` - Waiting for confirmation
- `confirmed` - Patient confirmed the ride
- `assigned` - Driver assigned
- `in-progress` - Driver en route or transporting
- `completed` - Ride finished successfully
- `cancelled` - Ride was cancelled

**Response:**
```json
{
  "success": true,
  "rideId": "RIDE001",
  "status": "confirmed",
  "rowIndex": 3
}
```

**Error Responses:**
- `400` - Missing status/rowIndex or invalid status value
- `403` - Access denied to this ride

### 4. Update Ride Details
**PATCH** `/api/org/:orgId/rides/:rideId`

Updates ride details including driver assignment and scheduling information.

**Path Parameters:**
- `orgId` (string) - The organization ID
- `rideId` (string) - The ride ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rowIndex": 3,
  "pickupTime": "09:00",
  "driverId": "DRV001",
  "driverName": "Driver Smith",
  "driverPlate": "ABC123",
  "driverCar": "Toyota Camry",
  "notes": "Updated special instructions"
}
```

**Required Fields:**
- `rowIndex` (number) - Google Sheets row index

**Optional Fields:**
- `appointmentId` (string) - Appointment identifier
- `pickupTime` (string) - Scheduled pickup time
- `roundTrip` (boolean) - Round trip requirement
- `appointmentTime` (string) - Appointment time
- `providerLocation` (string) - Provider address
- `notes` (string) - Special instructions
- `pickupLocation` (string) - Pickup address
- `driverId` (string) - Driver ID
- `driverName` (string) - Driver name
- `driverPlate` (string) - License plate
- `driverCar` (string) - Vehicle description

**Response:**
```json
{
  "success": true,
  "rideId": "RIDE001",
  "updatedFields": {
    "pickupTime": "09:00",
    "driverId": "DRV001",
    "driverName": "Driver Smith"
  },
  "rowIndex": 3
}
```

**Error Responses:**
- `400` - Missing rowIndex or no fields to update
- `403` - Access denied to this ride

## Ride Status Workflow

1. **pending** - Initial status when ride is created
2. **confirmed** - Patient confirms via email link
3. **assigned** - Driver assigned to the ride
4. **in-progress** - Driver picking up or transporting patient
5. **completed** - Ride successfully finished
6. **cancelled** - Ride was cancelled

## Email Notification System

When a ride is created:
1. System looks up patient email from EHR
2. Generates unique confirmation token
3. Sends confirmation email with ride details
4. Patient can confirm via email link
5. Confirmation updates ride status to "confirmed"

## Data Storage

Ride data is stored in Google Sheets with the following structure:

| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization ID |
| B | RideId | Unique ride identifier |
| C | PatientName | Patient's full name |
| D | PatientId | Patient identifier |
| E | AppointmentDate | Appointment date |
| F | AppointmentId | Appointment identifier |
| G | PickupTime | Scheduled pickup time |
| H | RoundTrip | Whether return trip needed |
| I | AppointmentTime | Appointment time |
| J | ProviderLocation | Healthcare provider address |
| K | Status | Current ride status |
| L | Notes | Special instructions |
| M | PickupLocation | Patient pickup address |
| N | DriverId | Assigned driver ID |
| O | DriverName | Assigned driver name |
| P | DriverPlate | Driver license plate |
| Q | DriverCar | Driver vehicle description |

## Business Rules

### Duplicate Prevention
- System prevents multiple rides for same patient/appointment combination
- Checks based on patient ID, appointment date, and time
- Also considers appointment ID if provided

### Past Appointment Validation
- Cannot create rides for appointments in the past
- Compares appointment date/time with current time
- Prevents scheduling errors

### Driver Assignment
- Drivers can be assigned during ride creation or updated later
- Driver information includes ID, name, license plate, and vehicle
- Supports driver claiming through separate driver routes

## Usage Examples

### Frontend Integration

```javascript
const orgId = 'ORG001'
const token = localStorage.getItem('authToken')

// Get all rides for organization
const ridesResponse = await fetch(`/api/org/${orgId}/rides`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const rides = await ridesResponse.json()

// Create new ride
const createResponse = await fetch(`/api/org/${orgId}/rides`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    patientId: 'PAT001',
    patientName: 'John Doe',
    appointmentDate: '2024-01-15',
    appointmentTime: '10:00',
    providerLocation: '123 Medical Center Dr',
    pickupLocation: '456 Patient St',
    roundTrip: true
  })
})
const newRide = await createResponse.json()

// Update ride status
const statusResponse = await fetch(`/api/org/${orgId}/rides/${rideId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'confirmed',
    rowIndex: 3
  })
})

// Assign driver to ride
const updateResponse = await fetch(`/api/org/${orgId}/rides/${rideId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rowIndex: 3,
    driverId: 'DRV001',
    driverName: 'Driver Smith',
    driverPlate: 'ABC123',
    pickupTime: '09:00'
  })
})
```

## Integration with Other Services

- **Email Service**: Sends confirmation emails to patients
- **Driver Service**: Manages driver assignments and availability
- **Patient Service**: Retrieves patient contact information
- **Appointment Service**: Links rides to healthcare appointments

## Error Handling

Standard HTTP status codes:
- `200` - Success
- `201` - Created (new ride)
- `400` - Bad Request (validation errors)
- `403` - Forbidden (access denied)
- `409` - Conflict (duplicate ride)
- `500` - Internal Server Error

## Security Features

- Organization-scoped access control
- JWT token authentication required
- Row-level access validation
- Input validation and sanitization

## Dependencies

- Google Sheets API (data storage)
- Express.js (routing)
- JWT authentication middleware
- Email service integration
- Token generation utilities
