import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

let sheets = null
let auth = null
let initializationError = null
let isInitializing = false

export const initializeGoogleSheets = async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
        // Wait for existing initialization to complete
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        return !initializationError
    }

    // Already initialized successfully
    if (sheets && auth) {
        return true
    }

    isInitializing = true

    try {
        let credentials
        
        // Try to get credentials from the ServiceAccount.json file first
        try {
            const fs = await import('fs')
            const serviceAccountPath = './ServiceAccount.json'
            const serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8')
            credentials = JSON.parse(serviceAccountKey)
        } catch (fileError) {
            // Fallback to individual environment variables (for Vercel/cloud deployment)
            if (process.env.GOOGLE_PROJECT_ID && (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY_CHUNK1) && process.env.GOOGLE_CLIENT_EMAIL) {
                let privateKeyB64 = ''
                
                // Check if we have the full key or need to reconstruct from chunks
                if (process.env.GOOGLE_PRIVATE_KEY) {
                    privateKeyB64 = process.env.GOOGLE_PRIVATE_KEY
                } else {
                    // Reconstruct from chunks
                    const chunks = []
                    let chunkIndex = 1
                    while (process.env[`GOOGLE_PRIVATE_KEY_CHUNK${chunkIndex}`]) {
                        chunks.push(process.env[`GOOGLE_PRIVATE_KEY_CHUNK${chunkIndex}`])
                        chunkIndex++
                    }
                    privateKeyB64 = chunks.join('')
                }
                
                const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf-8')
                
                credentials = {
                    type: "service_account",
                    project_id: process.env.GOOGLE_PROJECT_ID,
                    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                    private_key: privateKey,
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
                    universe_domain: "googleapis.com"
                }
            } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                // Fallback to JSON string
                credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
            } else {
                throw new Error('No Google Service Account credentials found. Please set either ServiceAccount.json file, GOOGLE_SERVICE_ACCOUNT_KEY, or individual environment variables.')
            }
        }
        
        auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        sheets = google.sheets({ version: 'v4', auth })
        console.log('Google Sheets API initialized')
        initializationError = null
        return true
    } catch (error) {
        console.error('Failed to initialize Google Sheets:', error.message)
        initializationError = error
        // Don't call process.exit() in serverless environment - throw instead
        throw error
    } finally {
        isInitializing = false
    }
}

export const getSheets = () => {
    if (!sheets) {
        throw new Error('Google Sheets not initialized. Call initializeGoogleSheets() first.')
    }
    return sheets
}

export const getAuth = () => auth

export const isInitialized = () => !!sheets
