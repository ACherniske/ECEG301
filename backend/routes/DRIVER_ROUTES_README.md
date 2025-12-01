# Driver Routes Documentation

## Overview
This module provides comprehensive driver management functionality for the transportation system, allowing drivers to manage their accounts and claim rides.

## Database Schema Updates

### Driver Accounts Sheet Structure
The `DriverAccounts` sheet has been updated with the following columns:
- **A**: Organization ID
- **B**: Driver ID (unique identifier)
- **C**: Driver Name
- **D**: Car Make
- **E**: Car Model
- **F**: License Plate Number
- **G**: Status (active/inactive)

### Rides Sheet Updates
The `Rides` sheet now includes:
- **N**: Driver ID (new column)
- **O**: Driver Name (shifted from N)
- **P**: Driver License Plate (shifted from O)

## API Endpoints

### 1. Get All Drivers
**GET** `/api/org/:orgId/drivers`

Retrieves all drivers for a specific organization.

**Response:**
```json
[
  {
    "rowIndex": 2,
    "id": "DRV001",
    "name": "John Smith",
    "carMake": "Toyota",
    "carModel": "Camry",
    "licensePlate": "ABC123",
    "status": "active"
  }
]
```

### 2. Get Specific Driver
**GET** `/api/org/:orgId/drivers/:driverId`

Retrieves details for a specific driver.

**Response:**
```json
{
  "orgId": "ORG001",
  "id": "DRV001",
  "name": "John Smith",
  "carMake": "Toyota",
  "carModel": "Camry",
  "licensePlate": "ABC123",
  "status": "active"
}
```

### 3. Create New Driver
**POST** `/api/org/:orgId/drivers`

Creates a new driver account.

**Request Body:**
```json
{
  "id": "DRV001",
  "name": "John Smith",
  "carMake": "Toyota",
  "carModel": "Camry",
  "licensePlate": "ABC123"
}
```

### 4. Update Driver Information
**PUT** `/api/org/:orgId/drivers/:driverId`

Updates existing driver information.

**Request Body:**
```json
{
  "name": "John Smith",
  "carMake": "Honda",
  "carModel": "Civic",
  "licensePlate": "XYZ789",
  "status": "active"
}
```

### 5. Get Available Rides
**GET** `/api/org/:orgId/drivers/:driverId/available-rides`

Retrieves rides that are available for the driver to claim.

**Response:**
```json
[
  {
    "rowIndex": 3,
    "orgId": "ORG001",
    "id": "RIDE001",
    "patientName": "Jane Doe",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "10:00",
    "status": "confirmed",
    "pickupLocation": "123 Main St",
    "providerLocation": "City Hospital"
  }
]
```

### 6. Claim a Ride
**POST** `/api/org/:orgId/drivers/:driverId/claim-ride`

Allows a driver to claim an available ride.

**Request Body:**
```json
{
  "rideId": "RIDE001",
  "rowIndex": 3
}
```

**Response:**
```json
{
  "success": true,
  "rideId": "RIDE001",
  "driverId": "DRV001",
  "driverName": "John Smith",
  "message": "Ride claimed successfully"
}
```

### 7. Get Claimed Rides
**GET** `/api/org/:orgId/drivers/:driverId/claimed-rides`

Retrieves all rides claimed by the driver.

**Response:**
```json
[
  {
    "rowIndex": 3,
    "id": "RIDE001",
    "patientName": "Jane Doe",
    "appointmentDate": "2024-01-15",
    "status": "claimed",
    "driverId": "DRV001"
  }
]
```

### 8. Update Ride Status
**PATCH** `/api/org/:orgId/drivers/:driverId/rides/:rideId/status`

Allows drivers to update the status of their claimed rides.

**Request Body:**
```json
{
  "status": "en route",
  "rowIndex": 3
}
```

**Valid Driver Statuses:**
- `en route` - Driver is on the way to pickup
- `in transit` - Patient is in the vehicle
- `arrived` - Arrived at destination
- `completed` - Ride fully completed

## Security Features

- All routes require authentication via JWT token
- Drivers can only access rides and information within their organization
- Drivers can only update status of rides they have claimed
- Cross-organization access is prevented

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing parameters, invalid status, etc.)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

## Usage Examples

### Frontend Integration
```javascript
// Get available rides for driver
const availableRides = await fetch(`/api/org/${orgId}/drivers/${driverId}/available-rides`, {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Claim a ride
const claimResponse = await fetch(`/api/org/${orgId}/drivers/${driverId}/claim-ride`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    rideId: 'RIDE001',
    rowIndex: 3
  })
})

// Update ride status
const statusResponse = await fetch(`/api/org/${orgId}/drivers/${driverId}/rides/${rideId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'en route',
    rowIndex: 3
  })
})
```

## Testing

Run the test suite:
```bash
node backend/test/driverTest.js
```

Make sure to update the `authToken` and `orgId` variables in the test file with valid values.

## Implementation Notes

1. The Driver ID column (N) has been added to the Rides sheet
2. Existing driver name and license plate columns have been shifted to O and P
3. Driver accounts are stored in the DriverAccounts sheet
4. All driver operations require organization-level authentication
5. Ride claiming is atomic and prevents double-claiming
6. Status updates are restricted to appropriate driver statuses
