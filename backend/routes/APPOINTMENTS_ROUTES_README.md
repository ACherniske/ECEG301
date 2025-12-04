# Appointments Routes

Patient appointment data from EHR system for ride scheduling.

## Endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/org/:orgId/patients/:patientId/appointments` | Get patient appointments |

## Response

```json
{
  "appointments": [
    {
      "id": "APPT001",
      "appointmentType": "Cardiology Consultation",
      "appointmentDate": "2024-01-15",
      "appointmentTime": "10:00",
      "location": "123 Medical Center Dr",
      "providerName": "Dr. Sarah Johnson"
    }
  ]
}
```

## Data Fields

| Field | Description |
|-------|-------------|
| `id` | Appointment identifier |
| `appointmentType` | Type of medical appointment |
| `appointmentDate` | Date (YYYY-MM-DD) |
| `appointmentTime` | Time (HH:MM) |
| `location` | Healthcare facility address |
| `providerName` | Provider name |
