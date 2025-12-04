# Provider Portal Backend API

A Node.js/Express backend API that integrates with Google Sheets to manage healthcare transportation rides, patient data, and appointments.

## 🚀 Deployment

### Vercel Deployment (Recommended)

This backend is optimized for Vercel serverless deployment.

**Prerequisites:**
- Vercel CLI installed (`npm i -g vercel`)
- Vercel account linked

**Deploy:**
```bash
cd backend
vercel --prod
```

**Required Environment Variables (set in Vercel dashboard):**
- `GOOGLE_SHEET_ID` - Your Google Sheets ID
- `GOOGLE_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_CLIENT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Base64 encoded private key
- `JWT_SECRET` - Secret for JWT token signing
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_APP_PASSWORD` - Gmail app password

### Local Development

**Prerequisites:**
- Node.js 20.x or higher  
- Google Cloud Service Account with Sheets API access

**Setup:**
```bash
cd backend
npm install
```

**Create `.env` file:**
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
GOOGLE_SHEET_ID=your-sheet-id
```

**Run locally:**
```bash
npm run dev
```

## 📡 API Routes

### Public Routes (No Authentication)
- `POST /api/auth/login` - User login
- `POST /api/auth/driver/login` - Driver login
- `POST /api/auth/driver/register` - Driver registration
- `GET /api/accept-invitation/:token` - Get invitation details
- `POST /api/accept-invitation/:token` - Accept invitation
- `GET /api/rides/:rideId/details` - Get ride details (with token)
- `POST /api/rides/:rideId/confirm` - Confirm ride

### Driver Portal Routes (Driver JWT Required)
- `GET /api/driver/profile` - Get driver profile
- `GET /api/driver/rides` - Get available rides
- `POST /api/driver/rides/:rideId/accept` - Accept a ride
- `PUT /api/driver/rides/:rideId/status` - Update ride status

### Protected Routes (JWT Required)
All routes under `/api/org/:orgId/` require authentication:
- `GET /api/org/:orgId/rides` - Get organization rides
- `POST /api/org/:orgId/rides` - Create ride
- `GET /api/org/:orgId/patients/search` - Search patients
- `GET /api/org/:orgId/patients/:patientId/appointments` - Get appointments
- `GET /api/org/:orgId/drivers` - Get drivers
- `GET /api/org/:orgId/users` - Get users
- `POST /api/org/:orgId/invitations` - Create invitation

## 📊 Google Sheets Structure

### Required Sheets:
- `Rides` - Transportation rides
- `Patients` - Patient records
- `Appointments` - Appointment data
- `DriverAccounts` - Driver accounts
- `ProviderAccounts` - Provider/staff accounts  
- `Organizations` - Organization data
- `Invitations` - User invitations

### Rides Sheet Columns (A-U)
| Column | Field |
|--------|-------|
| A | orgId |
| B | id |
| C | patientName |
| D | patientId |
| E | appointmentDate |
| F | appointmentId |
| G | pickupTime |
| H | roundTrip |
| I | appointmentTime |
| J | providerLocation |
| K | status |
| L | driverName |
| M | driverPlate |
| N | driverCar |
| O | appointmentType |
| P | providerName |
| Q | patientPhone |
| R | pickupLocation |
| S | notes |
| T | distanceMiles |
| U | durationMinutes |
| F | Phone | Contact phone number |
| G | Address | Patient home address |

### Appointments Sheet (Columns A-H)
| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization identifier |
| B | PatientId | Patient identifier |
| C | **AppointmentId** | **Appointment unique identifier** |
| D | AppointmentType | Type of appointment |
| E | Date | Appointment date (YYYY-MM-DD) |
| F | Time | Appointment time |
| G | Location | Appointment location |
| H | ProviderName | Healthcare provider name |

### DriverAccounts Sheet (Columns A-F)
| Column | Field | Description |
|--------|-------|-------------|
| A | OrgId | Organization identifier |
| B | DriverId | Driver unique identifier |
| C | Name | Driver full name |
| D | Make | Vehicle make |
| E | Model | Vehicle model |
| F | LicensePlate | Vehicle license plate |

## 🛠️ API Endpoints

### Health Check
- **GET** `/health` - Server health status with Google Sheets connection info

### Ride Management
- **GET** `/api/org/:orgId/rides` - Get all rides for organization
- **POST** `/api/org/:orgId/rides` - Create new ride
- **PATCH** `/api/org/:orgId/rides/:rideId/status` - Update ride status
- **PATCH** `/api/org/:orgId/rides/:rideId` - Update ride fields (all supported fields)

### Patient Management (EHR Integration)
- **GET** `/api/org/:orgId/patients/search?query=:searchTerm` - Search patients
- **GET** `/api/org/:orgId/patients/:patientId` - Get patient details

### Appointment Management
- **GET** `/api/org/:orgId/patients/:patientId/appointments` - Get patient appointments

### Driver Management
- **GET** `/api/org/:orgId/drivers` - Get driver accounts for organization

### User & Organization Management (Placeholders)
- **GET** `/api/org/:orgId/invitations` - Get invitations
- **POST** `/api/org/:orgId/invitations` - Create invitation
- **DELETE** `/api/org/:orgId/invitations/:invitationId` - Delete invitation
- **GET** `/api/org/:orgId/users` - Get organization users
- **DELETE** `/api/org/:orgId/users/:userId` - Remove user

## 📝 API Documentation

### Authentication
All API endpoints (except `/health`) use JWT authentication with development bypass:
```javascript
// Development mode bypasses authentication
if (process.env.NODE_ENV === 'development') {
    next() // Skip auth check
}
```

### Example Requests

#### Create New Ride (Updated with Appointment ID)
```bash
POST /api/org/org1/rides
Content-Type: application/json
Authorization: Bearer <token>

{
  "patientName": "John Doe",
  "patientId": "1001",
  "appointmentId": "APT-001",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00 AM",
  "providerLocation": "Main Hospital - Cardiology",
  "pickupLocation": "123 Main St, City, State",
  "notes": "Wheelchair assistance required",
  "driverName": "Mike Johnson",
  "driverPlate": "ABC123",
  "driverCar": "Toyota Camry"
}
```

#### Search Patients
```bash
GET /api/org/org1/patients/search?query=John
Authorization: Bearer <token>
```

#### Update Ride Fields (Batch Update)
```bash
PATCH /api/org/org1/rides/R001
Content-Type: application/json
Authorization: Bearer <token>

{
  "pickupTime": "9:30 AM",
  "driverName": "Sarah Wilson",
  "driverPlate": "XYZ789",
  "driverCar": "Honda Accord",
  "notes": "Updated: Oxygen tank required",
  "rowIndex": 5
}
```

## 🔧 Key Features

### Appointment ID Integration
- **Duplicate Prevention**: Uses appointment ID for more accurate duplicate ride detection
- **Data Consistency**: Links rides directly to specific appointments
- **Improved Tracking**: Better relationship between appointments and transportation

### Validation Features
- **Past Appointment Check**: Prevents scheduling rides for past appointments
- **Duplicate Ride Detection**: Uses appointment ID and date/time matching
- **Required Field Validation**: Ensures all necessary data is present

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `FRONTEND_URL` | CORS allowed origin | http://localhost:5173 | No |
| `GOOGLE_SHEET_ID` | Google Sheets document ID | - | **Yes** |
| `RIDES_SHEET` | Rides sheet name | Rides | No |
| `PATIENTS_SHEET` | Patients sheet name | Patients | No |
| `APPOINTMENTS_SHEET` | Appointments sheet name | Appointments | No |
| `DRIVERS_SHEET` | Driver accounts sheet name | DriverAccounts | No |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON string | - | **Yes** |

### Google Sheets Setup
1. Create a Google Cloud Service Account
2. Enable Google Sheets API
3. Download service account JSON
4. Share your Google Sheet with the service account email
5. Set the JSON as `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable

### CORS Configuration
- Allows requests from `FRONTEND_URL`
- Supports credentials
- Configured for development and production environments

## 🚨 Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error (development only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created  
- `400` - Bad Request (missing fields, invalid data)
- `401` - Unauthorized (missing/invalid token in production)
- `403` - Forbidden (access denied to resource)
- `404` - Not Found (route or resource not found)
- `500` - Internal Server Error

### Common Error Scenarios
- Missing `rowIndex` for updates → 400
- Invalid organization access → 403  
- Patient/ride not found → 404
- Google Sheets API errors → 500

## 🔒 Security Features

- **Organization-based access control** - All data filtered by `orgId`
- **Row-level security** - Updates require `rowIndex` verification
- **JWT authentication** (bypassed in development)
- **Input validation** on all endpoints
- **CORS protection** with specific origin allowlist

## 🏗️ Code Architecture

### Modular Route Structure
- **Routes**: Handle HTTP requests and responses
- **Config**: Google Sheets API initialization
- **Constants**: Centralized configuration values
- **Middleware**: Authentication and request processing
- **Utils**: Shared utility functions

### Google Sheets Integration
```javascript
// Centralized sheets initialization
await initializeGoogleSheets()
const sheets = getSheets() // Get authenticated client

// Batch operations for performance
await sheets.spreadsheets.values.batchUpdate({...})
```

### Data Validation
- Required field validation on POST/PATCH
- Organization access verification
- Valid status enum checking
- Row index verification for updates

## 🧪 Testing Endpoints

### Manual Testing URLs
```bash
# Health check
curl http://localhost:3000/health

# Search patients
curl "http://localhost:3000/api/org/org1/patients/search?query=John"

# Get rides
curl http://localhost:3000/api/org/org1/rides

# Get drivers
curl http://localhost:3000/api/org/org1/drivers
```

## 📋 Development Roadmap

### Current Status
- ✅ Modular route architecture
- ✅ Google Sheets integration
- ✅ Organization-based data isolation
- ✅ Comprehensive ride management
- ✅ EHR patient integration
- ✅ Driver assignment system

### TODO
- [ ] Implement proper JWT token verification
- [ ] Add data validation schemas (Joi/Zod)
- [ ] Add request rate limiting
- [ ] Add comprehensive logging (Winston)
- [ ] Add unit and integration tests
- [ ] Add API documentation (Swagger)
- [ ] Implement user management features
- [ ] Add invitation system
- [ ] Add WebSocket support for real-time updates

## 🐛 Troubleshooting

### Google Sheets Connection Issues
1. Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is valid JSON
2. Ensure service account has Editor access to the Google Sheet
3. Check `GOOGLE_SHEET_ID` matches your document ID
4. Verify all required sheets exist with correct headers

### Common Development Issues
```bash
# Check if server is running
curl http://localhost:3000/health

# Verify environment variables
node -e "console.log(process.env.GOOGLE_SHEET_ID)"

# Test Google Sheets access
# Check server logs for "Google Sheets API initialized"
```

### Authentication Problems
- Development mode bypasses auth automatically
- Production requires valid JWT Bearer tokens
- Check `NODE_ENV` environment variable

### Sheet Structure Problems
- Ensure column headers match exactly
- Verify data types are consistent
- Check for empty rows breaking data parsing
- Ensure `orgId` values match your organization identifier

## 📞 Support

For issues related to:
- **Google Sheets API**: Check Google Cloud Console logs
- **Authentication**: Verify JWT implementation
- **Data Structure**: Review sheet column mappings
- **Performance**: Monitor Google Sheets API quotas