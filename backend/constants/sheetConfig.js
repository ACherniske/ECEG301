export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1x74G7Okl56yoLku2XVdTpz3LWaNlJf9EBYp9J2kAX28'
export const RIDES_SHEET = process.env.RIDES_SHEET || 'Rides'
export const PATIENTS_SHEET = process.env.PATIENTS_SHEET || 'Patients'
export const APPOINTMENTS_SHEET = process.env.APPOINTMENTS_SHEET || 'Appointments'
export const DRIVER_ACCOUNTS_SHEET = process.env.DRIVER_ACCOUNTS_SHEET || 'DriverAccounts'

export const RANGES = {
    RIDES: 'A:N',
    PATIENTS: 'A:G',
    APPOINTMENTS: 'A:H',
    DRIVERS: 'A:F'
}

export const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']