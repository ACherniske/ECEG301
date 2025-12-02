# Complete API Routes Documentation

## Overview
This document provides a comprehensive overview of all API routes available in the healthcare transportation management system. The system is designed around organizations that manage users, patients, appointments, and ride requests.

## System Architecture

### Multi-Tenant Design
- **Organizations**: Top-level entities that contain all other data
- **Users**: Staff members belonging to organizations
- **Patients**: Individuals requiring transportation services
- **Appointments**: Medical appointments from EHR systems
- **Rides**: Transportation requests linking patients to appointments
- **Drivers**: Transportation providers who can claim and fulfill rides

### Authentication & Authorization
- JWT token-based authentication
- Organization-scoped data access
- Role-based permissions (admin, staff, provider)
- Public endpoints for ride confirmations and invitations

## Route Categories

### 1. Authentication Routes (`/api/auth/*`)
**File**: `backend/routes/auth.js`  
**Documentation**: [AUTH_ROUTES_README.md](./AUTH_ROUTES_README.md)

**Endpoints:**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/verify-token` - Token validation

**Features:**
- Secure password hashing
- JWT token generation
- Organization context in login response
- Token expiration handling

### 2. User Management Routes (`/api/org/:orgId/users/*`)
**File**: `backend/routes/users.js`  
**Documentation**: [USERS_ROUTES_README.md](./USERS_ROUTES_README.md)

**Endpoints:**
- `GET /api/org/:orgId/users` - List organization users
- `POST /api/org/:orgId/users` - Create new user
- `DELETE /api/org/:orgId/users/:userId` - Deactivate user

**Features:**
- Organization-scoped user management
- Role-based access control
- Soft delete (deactivation)
- User invitation acceptance

### 3. Ride Management Routes (`/api/org/:orgId/rides/*`)
**File**: `backend/routes/rides.js`  
**Documentation**: [RIDES_ROUTES_README.md](./RIDES_ROUTES_README.md)

**Endpoints:**
- `GET /api/org/:orgId/rides` - List organization rides
- `POST /api/org/:orgId/rides` - Create new ride request
- `PATCH /api/org/:orgId/rides/:rideId/status` - Update ride status
- `PATCH /api/org/:orgId/rides/:rideId` - Update ride details

**Features:**
- Comprehensive ride lifecycle management
- Email notifications with confirmation tokens
- Driver assignment and tracking
- Duplicate ride prevention
- Past appointment validation

### 4. Driver Management Routes (`/api/org/:orgId/drivers/*`)
**File**: `backend/routes/drivers.js`  
**Documentation**: [DRIVER_ROUTES_README.md](./DRIVER_ROUTES_README.md)

**Endpoints:**
- `GET /api/org/:orgId/drivers` - List organization drivers
- `GET /api/org/:orgId/drivers/:driverId` - Get driver details
- `POST /api/org/:orgId/drivers/:driverId/claim-ride` - Driver claims ride

**Features:**
- Driver registration and management
- Ride claiming system
- Driver availability tracking
- Vehicle information management

### 5. Patient Information Routes (`/api/org/:orgId/patients/*`)
**File**: `backend/routes/patients.js`  
**Documentation**: [PATIENTS_ROUTES_README.md](./PATIENTS_ROUTES_README.md)

**Endpoints:**
- `GET /api/org/:orgId/patients/search` - Search patients
- `GET /api/org/:orgId/patients/:patientId` - Get patient details

**Features:**
- Multi-criteria patient search
- EHR integration
- Privacy protection
- Contact information for notifications

### 6. Appointment Management Routes (`/api/org/:orgId/patients/:patientId/appointments`)
**File**: `backend/routes/appointments.js`  
**Documentation**: [APPOINTMENTS_ROUTES_README.md](./APPOINTMENTS_ROUTES_README.md)

**Endpoints:**
- `GET /api/org/:orgId/patients/:patientId/appointments` - List patient appointments

**Features:**
- EHR appointment integration
- Appointment scheduling context
- Provider information
- Location details for ride planning

### 7. Organization Management Routes (`/api/organizations/*`)
**File**: `backend/routes/organizations.js`  
**Documentation**: [ORGANIZATIONS_ROUTES_README.md](./ORGANIZATIONS_ROUTES_README.md)

**Endpoints:**
- `GET /api/organizations` - List all organizations (admin)
- `GET /api/organizations/:orgId` - Get organization details
- `POST /api/organizations` - Create new organization (admin)

**Features:**
- Multi-tenant organization management
- Admin-only operations
- Organization configuration
- Contact information management

### 8. Staff Invitation Routes (`/api/org/:orgId/invitations/*`)
**File**: `backend/routes/invitations.js`

**Endpoints:**
- `GET /api/org/:orgId/invitations` - List pending invitations
- `POST /api/org/:orgId/invitations` - Send staff invitation
- `DELETE /api/org/:orgId/invitations/:invitationId` - Cancel invitation

**Features:**
- Email-based staff invitations
- Role assignment during invitation
- Invitation token management
- Expiration handling

### 9. Public Invitation Routes (`/api/public/*`)
**File**: `backend/routes/publicInvitations.js`

**Endpoints:**
- `GET /api/public/accept-invitation/:token` - View invitation details
- `POST /api/public/accept-invitation/:token` - Accept staff invitation

**Features:**
- Token-based invitation acceptance
- Account creation during acceptance
- Password setup
- Organization onboarding

### 10. Public Ride Routes (`/api/public/*`)
**File**: `backend/routes/publicRides.js`

**Endpoints:**
- `GET /api/public/rides/:rideId/details` - View ride details
- `POST /api/public/rides/:rideId/confirm` - Confirm ride request

**Features:**
- Patient ride confirmation
- Email-based confirmations
- Ride detail verification
- Status updates

## Data Flow Examples

### Ride Creation Workflow
1. Staff searches for patient (`/api/org/:orgId/patients/search`)
2. Staff retrieves patient appointments (`/api/org/:orgId/patients/:patientId/appointments`)
3. Staff creates ride request (`/api/org/:orgId/rides`)
4. System sends email to patient with confirmation link
5. Patient confirms via public route (`/api/public/rides/:rideId/confirm`)
6. Driver claims ride (`/api/org/:orgId/drivers/:driverId/claim-ride`)
7. Ride status updates throughout journey

### User Onboarding Workflow
1. Admin sends invitation (`/api/org/:orgId/invitations`)
2. New user receives email with invitation token
3. User accepts invitation (`/api/public/accept-invitation/:token`)
4. Account is created and user can login (`/api/auth/login`)

## Security Considerations

### Authentication
- All protected routes require JWT tokens
- Tokens include organization context
- Token expiration enforced
- Secure password handling

### Authorization
- Organization-scoped data access
- Role-based permissions
- Row-level security for sensitive operations
- Public routes have limited, token-based access

### Data Protection
- Patient information privacy
- Organization data isolation
- Input validation and sanitization
- Error message sanitization

## Technology Stack

### Backend Framework
- **Express.js** - REST API framework
- **Node.js** - Runtime environment
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Data Storage
- **Google Sheets API** - Primary database
- **Structured sheet ranges** - Data organization
- **Real-time data access** - Live sheet updates

### External Integrations
- **Email Service** - Notifications and confirmations
- **EHR Systems** - Patient and appointment data
- **Mapping Services** - Address validation and routing

## API Standards

### Request Format
- JSON request/response bodies
- RESTful resource naming
- Consistent error responses
- Standard HTTP status codes

### Response Format
```json
{
  "data": { /* response data */ },
  "error": "Error message if applicable",
  "success": true/false
}
```

### Error Handling
- Meaningful error messages
- Appropriate HTTP status codes
- Input validation feedback
- Server error logging

## Development Guidelines

### Adding New Routes
1. Create route file in `backend/routes/`
2. Implement authentication middleware
3. Add organization scoping where applicable
4. Include comprehensive error handling
5. Write documentation following existing patterns
6. Add integration tests

### Best Practices
- Validate all inputs
- Use organization scoping for multi-tenancy
- Implement proper error handling
- Log important operations
- Follow RESTful conventions
- Document API changes

## Monitoring & Maintenance

### Logging
- Request/response logging
- Error tracking and reporting
- Performance monitoring
- Security audit trails

### Performance
- Efficient Google Sheets queries
- Response time optimization
- Caching strategies where appropriate
- Database query optimization

### Updates
- Backward compatibility considerations
- API versioning strategy
- Deployment procedures
- Data migration planning

This comprehensive documentation provides a complete reference for all API routes in the healthcare transportation management system. Each route category has detailed documentation in separate files for easy maintenance and reference.
