// Google Sheets Configuration
// Sheet ID should be set via environment variable in production
export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1x74G7Okl56yoLku2XVdTpz3LWaNlJf9EBYp9J2kAX28'

// Sheet Names
export const RIDES_SHEET = process.env.RIDES_SHEET || 'Rides'
export const PATIENTS_SHEET = process.env.PATIENTS_SHEET || 'Patients'
export const APPOINTMENTS_SHEET = process.env.APPOINTMENTS_SHEET || 'Appointments'
export const DRIVER_ACCOUNTS_SHEET = process.env.DRIVER_ACCOUNTS_SHEET || 'DriverAccounts'
export const INVITATIONS_SHEET = process.env.INVITATIONS_SHEET || 'Invitations'
export const PROVIDER_ACCOUNTS_SHEET = process.env.PROVIDER_ACCOUNTS_SHEET || 'ProviderAccounts'
export const ORGANIZATIONS_SHEET = process.env.ORGANIZATIONS_SHEET || 'Organizations'

// Column Ranges for each sheet
export const RANGES = {
    RIDES: 'A:U',
    PATIENTS: 'A:H',
    APPOINTMENTS: 'A:H',
    DRIVERS: 'A:K',
    INVITATIONS: 'A:I',
    PROVIDER_ACCOUNTS: 'A:I',
    ORGANIZATIONS: 'A:F'
}

// Valid status values
export const VALID_STATUSES = [
    'pending',
    'confirmed',
    'claimed',
    'en route',
    'in transit',
    'arrived',
    'completed',
    'cancelled'
]

export const VALID_ROLES = [
    'developer',
    'administrator',
    'staff'
]

export const VALID_INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired']
export const VALID_ORG_STATUSES = ['active', 'inactive', 'suspended']