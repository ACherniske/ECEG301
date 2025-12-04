# Patients Routes

Patient information from EHR system for ride scheduling.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/org/:orgId/patients/search?query=` | Search patients |
| GET | `/api/org/:orgId/patients/:patientId` | Get patient details |

## Search Response

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
  }
]
```

## Search Criteria

Matches against:
- Patient ID (exact)
- First/Last name (partial)
- Phone number (partial)

Search is case-insensitive and organization-scoped.

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Missing search query |
| 404 | Patient not found |
| 500 | Server error |
