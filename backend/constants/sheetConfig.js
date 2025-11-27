export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1x74G7Okl56yoLku2XVdTpz3LWaNlJf9EBYp9J2kAX28'
export const RIDES_SHEET = process.env.RIDES_SHEET || 'Rides'
export const PATIENTS_SHEET = process.env.PATIENTS_SHEET || 'Patients'
export const APPOINTMENTS_SHEET = process.env.APPOINTMENTS_SHEET || 'Appointments'
export const DRIVER_ACCOUNTS_SHEET = process.env.DRIVER_ACCOUNTS_SHEET || 'DriverAccounts'
export const INVITATIONS_SHEET = process.env.INVITATIONS_SHEET || 'Invitations'
export const PROVIDER_ACCOUNTS_SHEET = process.env.PROVIDER_ACCOUNTS_SHEET || 'ProviderAccounts'

export const RANGES = {
    RIDES: 'A:O',
    PATIENTS: 'A:G',
    APPOINTMENTS: 'A:H',
    DRIVERS: 'A:F',
    INVITATIONS: 'A:I',
    PROVIDER_ACCOUNTS: 'A:H'
}

export const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']
export const VALID_ROLES = ['provider', 'staff', 'admin', 'dev']
export const VALID_INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired']