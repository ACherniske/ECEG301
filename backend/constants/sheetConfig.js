export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1x74G7Okl56yoLku2XVdTpz3LWaNlJf9EBYp9J2kAX28'
export const RIDES_SHEET = process.env.RIDES_SHEET || 'Rides'
export const PATIENTS_SHEET = process.env.PATIENTS_SHEET || 'Patients'
export const APPOINTMENTS_SHEET = process.env.APPOINTMENTS_SHEET || 'Appointments'
export const DRIVER_ACCOUNTS_SHEET = process.env.DRIVER_ACCOUNTS_SHEET || 'DriverAccounts'
export const INVITATIONS_SHEET = process.env.INVITATIONS_SHEET || 'Invitations'
export const PROVIDER_ACCOUNTS_SHEET = process.env.PROVIDER_ACCOUNTS_SHEET || 'ProviderAccounts'
export const ORGANIZATIONS_SHEET = process.env.ORGANIZATIONS_SHEET || 'Organizations'

export const RANGES = {
    RIDES: 'A:Q',
    PATIENTS: 'A:H',
    APPOINTMENTS: 'A:H',
    DRIVERS: 'A:J',
    INVITATIONS: 'A:I',
    PROVIDER_ACCOUNTS: 'A:I',
    ORGANIZATIONS: 'A:F'
}

export const VALID_STATUSES = [
    'pending',      // Awaiting patient confirmation
    'confirmed',    // Confirmed by patient
    'claimed',      // Driver has claimed the ride
    'en route',     // Driver is on the way to pickup
    'in transit',   // Patient is in the vehicle
    'arrived',      // Arrived at destination
    'completed',    // Ride fully completed
    'cancelled'     // Ride cancelled
]

export const VALID_ROLES = [
    'developer',    // Full system access
    'administrator', // Organization admin access
    'staff'         // Basic staff access (can schedule rides)
]

export const VALID_INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired']
export const VALID_ORG_STATUSES = ['active', 'inactive', 'suspended']