# Appointments Routes Documentation

## Overview
This module provides access to patient appointment information from the Electronic Health Record (EHR) system. It allows retrieval of appointment schedules for patients to facilitate ride scheduling and transportation planning.

## Base Path
All appointment routes are available at `/api/org/:orgId/patients/:patientId/appointments`

## Authentication
All routes require authentication via JWT token in Authorization header: `Bearer <token>`

## API Endpoints

### 1. Get Patient Appointments
**GET** `/api/org/:orgId/patients/:patientId/appointments`

Retrieves all appointments for a specific patient within an organization.

**Path Parameters:**
- `orgId` (string) - The organization ID
- `patientId` (string) - The patient ID

**Headers:**
```
Authorization: Bearer <token>
```

**Request Example:**
```
GET /api/org/ORG001/patients/PAT001/appointments
```

**Response:**
```json
[
  {
    "id": "APPT001",
    "appointmentType": "Cardiology Consultation",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "10:00",
    "location": "123 Medical Center Dr, Suite 200",
    "providerName": "Dr. Sarah Johnson"
  },
  {
    "id": "APPT002",
    "appointmentType": "Follow-up Visit",
    "appointmentDate": "2024-01-22",
    "appointmentTime": "14:30",
    "location": "456 Health Plaza, Floor 3",
    "providerName": "Dr. Michael Chen"
  }
]
```

**Response Details:**
- Returns only appointments for the specified patient
- Appointments are filtered by organization ID
- Only includes appointments with valid dates
- Sorted by appointment date/time

**Error Responses:**
- `500` - Internal server error

## Appointment Data Structure

Appointment information includes:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique appointment identifier |
| appointmentType | string | Type of medical appointment |
| appointmentDate | string | Appointment date (YYYY-MM-DD format) |
| appointmentTime | string | Appointment time (HH:MM format) |
| location | string | Healthcare facility address |
| providerName | string | Healthcare provider's name |

## Data Storage

Appointment data is stored in Google Sheets with the following structure:

| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization ID |
| B | PatientId | Patient identifier |
| C | AppointmentId | Unique appointment identifier |
| D | AppointmentType | Type of medical appointment |
| E | AppointmentDate | Appointment date |
| F | AppointmentTime | Appointment time |
| G | Location | Healthcare facility address |
| H | ProviderName | Healthcare provider's name |

## Business Logic

### Data Filtering
- Only returns appointments for the specified patient
- Organization-scoped access control
- Excludes appointments without valid dates
- Maintains patient privacy across organizations

### Appointment Validation
- Appointments must have valid dates to be included
- Empty or null appointment dates are filtered out
- Time format validation ensures consistent display

## Usage Examples

### Frontend Integration

```javascript
const orgId = 'ORG001'
const patientId = 'PAT001'
const token = localStorage.getItem('authToken')

// Get all appointments for a patient
const appointmentsResponse = await fetch(`/api/org/${orgId}/patients/${patientId}/appointments`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const appointments = await appointmentsResponse.json()

// Display appointments in UI
appointments.forEach(appointment => {
  console.log(`${appointment.appointmentType} on ${appointment.appointmentDate} at ${appointment.appointmentTime}`)
  console.log(`Provider: ${appointment.providerName}`)
  console.log(`Location: ${appointment.location}`)
})
```

### Ride Scheduling Integration

```javascript
// Use appointment data to create ride requests
const scheduleRide = async (appointment, patientData) => {
  const rideData = {
    patientId: patientData.id,
    patientName: `${patientData.firstName} ${patientData.lastName}`,
    appointmentId: appointment.id,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    providerLocation: appointment.location,
    pickupLocation: patientData.address,
    notes: `${appointment.appointmentType} with ${appointment.providerName}`
  }
  
  const rideResponse = await fetch(`/api/org/${orgId}/rides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(rideData)
  })
  
  return await rideResponse.json()
}
```

### Calendar Integration

```javascript
// Format appointments for calendar display
const formatAppointmentsForCalendar = (appointments) => {
  return appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.appointmentType} - ${appointment.providerName}`,
    start: `${appointment.appointmentDate}T${appointment.appointmentTime}:00`,
    description: `Location: ${appointment.location}`,
    extendedProps: {
      patientId: appointment.patientId,
      appointmentType: appointment.appointmentType,
      providerName: appointment.providerName,
      location: appointment.location
    }
  }))
}
```

## Integration with Other Services

### Rides Service
- Appointment data is used to create transportation requests
- Appointment ID links rides to specific medical visits
- Provider location becomes destination for rides
- Appointment time helps schedule pickup times

### Patients Service
- Patient information combined with appointments for complete context
- Patient address used as pickup location for rides
- Patient contact info used for ride notifications

### EHR Integration
- Appointment data synced from Electronic Health Records
- Real-time updates reflect schedule changes
- Provider information includes facility details

## Security Features

- Organization-scoped access control
- JWT authentication required
- Patient data privacy protection
- Appointment confidentiality maintained

## Data Quality

### Validation Rules
- Appointment dates must be valid
- Times must be in HH:MM format
- Provider names and locations required
- Appointment types standardized

### Data Consistency
- Appointment IDs unique within organization
- Patient IDs validated against patient database
- Date/time formats standardized
- Location information complete

## Error Handling

Standard HTTP status codes:
- `200` - Success (returns array, empty if no appointments)
- `500` - Internal Server Error

Note: This endpoint returns an empty array rather than 404 when no appointments are found, as this is considered a valid state.

## Performance Considerations

- Efficient filtering by organization and patient ID
- Minimal data transfer with only essential fields
- Quick response times for real-time scheduling
- Optimized for frequent queries during ride scheduling

## Dependencies

- Google Sheets API (data storage)
- Express.js (routing)
- JWT authentication middleware
- EHR data synchronization
