import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

let sheets = null
let auth = null

export const initializeGoogleSheets = async () => {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        
        auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        sheets = google.sheets({ version: 'v4', auth })
        console.log('Google Sheets API initialized')
    } catch (error) {
        console.error('Failed to initialize Google Sheets:', error.message)
        process.exit(1)
    }
}

export const getSheets = () => sheets
export const getAuth = () => auth
