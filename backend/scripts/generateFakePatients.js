import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, PATIENTS_SHEET, RANGES } from '../constants/sheetConfig.js'

// Arrays of realistic fake data
const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
    'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
    'Charles', 'Helen', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Dorothy', 'Mark', 'Lisa',
    'Donald', 'Sandra', 'Steven', 'Donna', 'Paul', 'Carol', 'Andrew', 'Ruth', 'Joshua', 'Sharon',
    'Kenneth', 'Michelle', 'Kevin', 'Laura', 'Brian', 'Sarah', 'George', 'Kimberly', 'Timothy', 'Deborah',
    'Ronald', 'Dorothy', 'Jason', 'Lisa', 'Edward', 'Nancy', 'Jeffrey', 'Karen', 'Ryan', 'Betty',
    'Jacob', 'Helen', 'Gary', 'Sandra', 'Nicholas', 'Donna', 'Eric', 'Carol', 'Jonathan', 'Ruth',
    'Stephen', 'Sharon', 'Larry', 'Michelle', 'Justin', 'Laura', 'Scott', 'Sarah', 'Brandon', 'Kimberly'
]

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
]

const emailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 
    'icloud.com', 'comcast.net', 'att.net', 'verizon.net', 'msn.com'
]

const phoneAreaCodes = ['555', '000', '111', '222', '333', '444', '666', '777', '888', '999']

// Function to generate random data
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)]

const generatePatientId = (index) => `PAT${(index + 1).toString().padStart(4, '0')}`

const generatePhoneNumber = () => {
    const areaCode = getRandomItem(phoneAreaCodes)
    const exchange = Math.floor(Math.random() * 900) + 100
    const number = Math.floor(Math.random() * 9000) + 1000
    return `(${areaCode}) ${exchange}-${number}`
}

const generateEmail = (firstName, lastName) => {
    return 'apc011@bucknell.edu'
}

const generateBirthDate = () => {
    const startDate = new Date('1940-01-01')
    const endDate = new Date('2005-12-31')
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    const date = new Date(randomTime)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

const generateAddress = () => {
    // Real addresses in towns within 10 miles of Bucknell University
    const realAddresses = [
        // Lewisburg, PA (17837) - where Bucknell is located
        '123 Market St, Lewisburg, PA 17837',
        '456 St Louis St, Lewisburg, PA 17837',
        '789 Buffalo Rd, Lewisburg, PA 17837',
        '234 N Derr Dr, Lewisburg, PA 17837',
        '567 Fairground Rd, Lewisburg, PA 17837',
        '890 St Mary St, Lewisburg, PA 17837',
        '345 University Ave, Lewisburg, PA 17837',
        '678 S 3rd St, Lewisburg, PA 17837',
        '901 N 4th St, Lewisburg, PA 17837',
        '432 S 5th St, Lewisburg, PA 17837',
        
        // Mifflinburg, PA (17844)
        '123 Market St, Mifflinburg, PA 17844',
        '456 Chestnut St, Mifflinburg, PA 17844',
        '789 Green St, Mifflinburg, PA 17844',
        '234 Walnut St, Mifflinburg, PA 17844',
        '567 Elm Ave, Mifflinburg, PA 17844',
        '890 Industrial Blvd, Mifflinburg, PA 17844',
        '345 N 3rd St, Mifflinburg, PA 17844',
        '678 S 4th St, Mifflinburg, PA 17844',
        
        // Selinsgrove, PA (17870)
        '123 Market St, Selinsgrove, PA 17870',
        '456 N Market St, Selinsgrove, PA 17870',
        '789 University Ave, Selinsgrove, PA 17870',
        '234 Pine St, Selinsgrove, PA 17870',
        '567 Susquehanna Ave, Selinsgrove, PA 17870',
        '890 Water St, Selinsgrove, PA 17870',
        '345 Orange St, Selinsgrove, PA 17870',
        '678 N High St, Selinsgrove, PA 17870',
        
        // Milton, PA (17847)
        '123 Broadway, Milton, PA 17847',
        '456 Front St, Milton, PA 17847',
        '789 Mahoning St, Milton, PA 17847',
        '234 Center St, Milton, PA 17847',
        '567 Elm St, Milton, PA 17847',
        '890 Ridge Ave, Milton, PA 17847',
        '345 S Front St, Milton, PA 17847',
        
        // Sunbury, PA (17801)
        '123 Market St, Sunbury, PA 17801',
        '456 N 3rd St, Sunbury, PA 17801',
        '789 Chestnut St, Sunbury, PA 17801',
        '234 Race St, Sunbury, PA 17801',
        '567 Arch St, Sunbury, PA 17801',
        '890 S 4th St, Sunbury, PA 17801',
        '345 Walnut St, Sunbury, PA 17801',
        
        // New Berlin, PA (17855)
        '123 Market St, New Berlin, PA 17855',
        '456 Front St, New Berlin, PA 17855',
        '789 High St, New Berlin, PA 17855',
        '234 Church St, New Berlin, PA 17855',
        '567 Water St, New Berlin, PA 17855',
        
        // Winfield, PA (17889)
        '123 Main St, Winfield, PA 17889',
        '456 Old Trail, Winfield, PA 17889',
        '789 Buffalo Valley Rd, Winfield, PA 17889',
        
        // Watsontown, PA (17777)
        '123 Main St, Watsontown, PA 17777',
        '456 8th St, Watsontown, PA 17777',
        '789 Elm Ave, Watsontown, PA 17777',
        '234 Susquehanna Ave, Watsontown, PA 17777',
        
        // White Deer, PA (17887)
        '123 Main St, White Deer, PA 17887',
        '456 Allenwood Rd, White Deer, PA 17887',
        '789 Front St, White Deer, PA 17887',
        
        // Danville, PA (17821)
        '123 Mill St, Danville, PA 17821',
        '456 Market St, Danville, PA 17821',
        '789 Church St, Danville, PA 17821',
        '234 Ferry St, Danville, PA 17821',
        '567 Bloom St, Danville, PA 17821',
        
        // Northumberland, PA (17857)
        '123 King St, Northumberland, PA 17857',
        '456 2nd St, Northumberland, PA 17857',
        '789 Orange St, Northumberland, PA 17857',
        '234 Front St, Northumberland, PA 17857',
        
        // Middleburg, PA (17842)
        '123 Market St, Middleburg, PA 17842',
        '456 High St, Middleburg, PA 17842',
        '789 Water St, Middleburg, PA 17842'
    ]
    
    return getRandomItem(realAddresses)
}

const generatePatients = async () => {
    console.log('Starting patient generation...')
    
    try {
        const sheets = getSheets()
        if (!sheets) {
            console.error('Google Sheets not initialized')
            return
        }

        // Check current patients to avoid duplicates
        const existingResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
        })

        const existingRows = existingResponse.data.values || []
        let existingPatientIds = new Set()
        
        if (existingRows.length > 1) {
            existingPatientIds = new Set(existingRows.slice(1).map(row => row[1]))
        }

        const patients = []
        let generatedCount = 0

        for (let i = 0; i < 200; i++) {
            let patientId
            let attempts = 0
            
            // Generate unique patient ID
            do {
                patientId = generatePatientId(existingRows.length - 1 + generatedCount + attempts)
                attempts++
            } while (existingPatientIds.has(patientId) && attempts < 1000)

            if (attempts >= 1000) {
                console.error('Could not generate unique patient ID')
                break
            }

            const firstName = getRandomItem(firstNames)
            const lastName = getRandomItem(lastNames)
            const email = generateEmail(firstName, lastName)
            const phone = generatePhoneNumber()
            const birthDate = generateBirthDate()
            const address = generateAddress()

            // Patient row structure: [orgId, patientId, firstName, lastName, DoB, phoneNum, address, email]
            const patientRow = [
                'org1',          // A - Organization ID
                patientId,       // B - Patient ID
                firstName,       // C - First Name
                lastName,        // D - Last Name
                birthDate,       // E - Date of Birth
                phone,           // F - Phone Number
                address,         // G - Address
                email            // H - Email
            ]

            patients.push(patientRow)
            existingPatientIds.add(patientId)
            generatedCount++
        }

        console.log(`Generated ${patients.length} patients`)

        // Batch insert patients (Google Sheets API has limits, so we'll do it in chunks)
        const chunkSize = 50
        for (let i = 0; i < patients.length; i += chunkSize) {
            const chunk = patients.slice(i, i + chunkSize)
            
            console.log(`Inserting patients ${i + 1} to ${Math.min(i + chunkSize, patients.length)}...`)
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: chunk
                }
            })

            // Small delay between chunks to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        console.log(`Successfully created ${patients.length} fake patients in org1!`)
        
        // Display sample of created patients
        console.log('\nSample patients created:')
        patients.slice(0, 5).forEach((patient, index) => {
            console.log(`${index + 1}. ${patient[2]} ${patient[3]} (${patient[1]}) - ${patient[7]}`)
        })

    } catch (error) {
        console.error('Error generating patients:', error)
    }
}

// Export the function for use in other files
export { generatePatients }

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generatePatients()
}
