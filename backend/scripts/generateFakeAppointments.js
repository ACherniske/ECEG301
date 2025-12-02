import { getSheets } from '../config/googleSheets.js'
import { SHEET_ID, APPOINTMENTS_SHEET, PATIENTS_SHEET, RANGES } from '../constants/sheetConfig.js'

// Arrays of fake doctor names
const doctorFirstNames = [
    'Emily', 'Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Lisa', 'James', 'Maria', 'John',
    'Amanda', 'Christopher', 'Jessica', 'Daniel', 'Ashley', 'Matthew', 'Nicole', 'Andrew', 'Rachel', 'Kevin',
    'Stephanie', 'Brian', 'Michelle', 'William', 'Kimberly', 'Joseph', 'Angela', 'Ryan', 'Melissa', 'Steven',
    'Elizabeth', 'Jonathan', 'Amy', 'Mark', 'Laura', 'Thomas', 'Rebecca', 'Anthony', 'Susan', 'Charles'
]

const doctorLastNames = [
    'Anderson', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
    'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker',
    'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
    'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips'
]

// Real healthcare providers within 10 miles of Lewisburg, PA
const healthcareProviders = [
    // Lewisburg
    'Evangelical Community Hospital, 1 Hospital Dr, Lewisburg, PA 17837',
    'Geisinger Medical Group - Lewisburg, 15 Medical Center Dr, Lewisburg, PA 17837',
    'Buffalo Valley Regional Health Center, 350 Buffalo Rd, Lewisburg, PA 17837',
    'Lewisburg Family Practice, 112 Woodbine Ln, Lewisburg, PA 17837',
    'Central Susquehanna Community Health Center, 2 South 4th St, Lewisburg, PA 17837',
    'Bucknell University Health Center, 100 Dent Dr, Lewisburg, PA 17837',
    'Lewisburg Pediatric Associates, 15 Hospital Dr, Lewisburg, PA 17837',
    
    // Selinsgrove
    'Geisinger Medical Center Selinsgrove, 1 Hospital Dr, Selinsgrove, PA 17870',
    'Susquehanna Health Selinsgrove, 410 N Duke St, Selinsgrove, PA 17870',
    'Valley Primary Care, 304 N Market St, Selinsgrove, PA 17870',
    'Central Susquehanna Health System, 100 N Academy Ave, Selinsgrove, PA 17870',
    'Selinsgrove Family Medicine, 215 N Market St, Selinsgrove, PA 17870',
    
    // Sunbury
    'Geisinger Medical Group - Sunbury, 350 N 11th St, Sunbury, PA 17801',
    'Sunbury Community Hospital, 350 N 11th St, Sunbury, PA 17801',
    'UPMC Susquehanna Sunbury, 350 N 11th St, Sunbury, PA 17801',
    'Sunbury Family Practice, 1270 N 4th St, Sunbury, PA 17801',
    'Coordinated Health - Sunbury, 2045 Northway Dr, Sunbury, PA 17801',
    
    // Milton
    'Geisinger Medical Group - Milton, 15 Mahoning St, Milton, PA 17847',
    'Evangelical Community Hospital - Milton Campus, 25 Monument Sq, Milton, PA 17847',
    'Milton Family Practice, 547 Mahoning St, Milton, PA 17847',
    
    // Mifflinburg
    'Evangelical Community Hospital - Mifflinburg, 100 Hospital Dr, Mifflinburg, PA 17844',
    'Mifflinburg Medical Associates, 333 Chestnut St, Mifflinburg, PA 17844',
    'Central PA Family Medicine, 123 Market St, Mifflinburg, PA 17844',
    
    // Danville
    'Geisinger Medical Center, 100 N Academy Ave, Danville, PA 17821',
    'Geisinger Janet Weis Children\'s Hospital, 100 N Academy Ave, Danville, PA 17821',
    'Danville Family Practice, 200 Mill St, Danville, PA 17821',
    'Central Susquehanna Medical Group, 532 Bloom St, Danville, PA 17821',
    
    // Northumberland
    'UPMC Susquehanna Northumberland, 1001 Fourth St, Northumberland, PA 17857',
    'Northumberland Family Medicine, 123 King St, Northumberland, PA 17857'
]

const appointmentTypes = [
    'Annual Physical', 'Follow-up Visit', 'Consultation', 'Lab Results Review',
    'Preventive Care', 'Wellness Check', 'Routine Check-up', 'Health Screening',
    'Blood Pressure Check', 'Diabetes Management', 'Medication Review',
    'Vaccination', 'Flu Shot', 'Physical Therapy Evaluation',
    'Specialist Consultation', 'Cardiology Follow-up', 'Dermatology Screening',
    'Vision Exam', 'Hearing Test', 'Mental Health Consultation'
]

// Function to generate random data
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)]

const generateAppointmentId = (index) => `APT${(index + 1).toString().padStart(4, '0')}`

const generateDoctorName = () => {
    const firstName = getRandomItem(doctorFirstNames)
    const lastName = getRandomItem(doctorLastNames)
    const titles = ['Dr.', 'Dr.', 'Dr.', 'Dr.', 'Dr.', 'PA', 'NP'] // Mostly doctors, some PAs and NPs
    const title = getRandomItem(titles)
    return `${title} ${firstName} ${lastName}`
}

const generateAppointmentDate = () => {
    // Generate dates between today and 90 days from now
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + 90)
    
    const randomTime = today.getTime() + Math.random() * (futureDate.getTime() - today.getTime())
    const date = new Date(randomTime)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

const generateAppointmentTime = () => {
    // Generate appointment times between 8:00 AM and 5:00 PM
    const hours = Math.floor(Math.random() * 9) + 8 // 8-16 (8 AM to 4 PM)
    const minutes = Math.random() < 0.5 ? '00' : '30' // Either :00 or :30
    return `${hours.toString().padStart(2, '0')}:${minutes}`
}

const generateAppointments = async () => {
    console.log('Starting appointment generation...')
    
    try {
        const sheets = getSheets()
        if (!sheets) {
            console.error('Google Sheets not initialized')
            return
        }

        // Get existing patients from org1
        console.log('Fetching existing patients...')
        const patientsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${PATIENTS_SHEET}!${RANGES.PATIENTS}`,
        })

        const patientRows = patientsResponse.data.values || []
        if (patientRows.length <= 1) {
            console.error('No patients found! Please generate patients first.')
            return
        }

        // Filter for org1 patients only
        const org1Patients = patientRows.slice(1).filter(row => row[0] === 'org1')
        
        if (org1Patients.length === 0) {
            console.error('No patients found for org1! Please generate patients for org1 first.')
            return
        }

        console.log(`Found ${org1Patients.length} patients in org1`)

        // Check existing appointments to avoid duplicates
        const existingAppointmentsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${APPOINTMENTS_SHEET}!${RANGES.APPOINTMENTS}`,
        })

        const existingAppointmentRows = existingAppointmentsResponse.data.values || []
        let existingAppointmentIds = new Set()
        
        if (existingAppointmentRows.length > 1) {
            existingAppointmentIds = new Set(existingAppointmentRows.slice(1).map(row => row[1]))
        }

        const appointments = []
        let generatedCount = 0

        for (let i = 0; i < 200; i++) {
            let appointmentId
            let attempts = 0
            
            // Generate unique appointment ID
            do {
                appointmentId = generateAppointmentId(existingAppointmentRows.length - 1 + generatedCount + attempts)
                attempts++
            } while (existingAppointmentIds.has(appointmentId) && attempts < 1000)

            if (attempts >= 1000) {
                console.error('Could not generate unique appointment ID')
                break
            }

            // Select random patient
            const randomPatient = getRandomItem(org1Patients)
            const patientId = randomPatient[1] // Patient ID is in column B

            // Generate appointment details
            const appointmentDate = generateAppointmentDate()
            const appointmentTime = generateAppointmentTime()
            const providerLocation = getRandomItem(healthcareProviders)
            const doctorName = generateDoctorName()
            const appointmentType = getRandomItem(appointmentTypes)

            // Appointment row structure: [orgId, patientId, appointmentId, appType, appDate, appTime, location, provName]
            const appointmentRow = [
                'org1',                     // A - Organization ID
                patientId,                  // B - Patient ID
                appointmentId,              // C - Appointment ID
                appointmentType,            // D - Appointment Type
                appointmentDate,            // E - Appointment Date
                appointmentTime,            // F - Appointment Time  
                providerLocation,           // G - Location
                doctorName                  // H - Provider Name
            ]

            appointments.push(appointmentRow)
            existingAppointmentIds.add(appointmentId)
            generatedCount++
        }

        console.log(`Generated ${appointments.length} appointments`)

        // Batch insert appointments (Google Sheets API has limits, so we'll do it in chunks)
        const chunkSize = 50
        for (let i = 0; i < appointments.length; i += chunkSize) {
            const chunk = appointments.slice(i, i + chunkSize)
            
            console.log(`Inserting appointments ${i + 1} to ${Math.min(i + chunkSize, appointments.length)}...`)
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: `${APPOINTMENTS_SHEET}!${RANGES.APPOINTMENTS}`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: chunk
                }
            })

            // Small delay between chunks to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        console.log(`Successfully created ${appointments.length} fake appointments for org1!`)
        
        // Display sample of created appointments
        console.log('\nSample appointments created:')
        appointments.slice(0, 5).forEach((appointment, index) => {
            console.log(`${index + 1}. ${appointment[1]} (${appointment[2]}) - ${appointment[3]} on ${appointment[4]} at ${appointment[5]}`)
        })

    } catch (error) {
        console.error('Error generating appointments:', error)
    }
}

// Export the function for use in other files
export { generateAppointments }

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generateAppointments()
}
