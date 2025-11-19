/**
 * Script to add a new historical ride to the Google Sheet
 * Demonstrates writing data to Google Sheets API
 * Run with: node addHistoricalRide.js
 */

const { google } = require('googleapis');
const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
    keyFile: 'APIKeys/sheetsAPIKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Note: needs write access
});

/**
 * Append a new row to a Google Sheet
 * @param {string} sheetId - The spreadsheet ID
 * @param {string} range - The range to append to (e.g., 'SheetName!A:H')
 * @param {Array} values - Array of values to append as a new row
 */
async function appendRow(sheetId, range, values) {
    const client = await auth.getClient();
    const res = await sheets.spreadsheets.values.append({
        auth: client,
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: 'USER_ENTERED', // Parses input as if typed into the UI
        requestBody: {
            values: [values] // Wrap in array since API expects array of rows
        }
    });
    return res.data;
}

/**
 * Generate a new ride ID based on existing rides
 */
function generateRideId(existingRides) {
    if (!existingRides || existingRides.length === 0) {
        return 'R0001';
    }
    
    // Extract numbers from existing ride IDs and find the max
    const maxId = existingRides
        .map(ride => parseInt(ride[0].substring(1))) // Assuming ride ID is first column
        .filter(num => !isNaN(num))
        .reduce((max, num) => Math.max(max, num), 0);
    
    // Generate new ID with leading zeros
    return 'R' + String(maxId + 1).padStart(4, '0');
}

/**
 * Read existing rides to generate proper ID
 */
async function getExistingRides(sheetId, range) {
    const client = await auth.getClient();
    const res = await sheets.spreadsheets.values.get({
        auth: client,
        spreadsheetId: sheetId,
        range: range,
    });
    return res.data.values || [];
}

/**
 * Main function to add a historical ride
 */
async function addHistoricalRide(rideData) {
    console.log('Adding new historical ride to Google Sheet...\n');
    
    const spreadsheetId = '1ciuFYvLtv0pX_qojkEnif7enN7_CbgmMdyA27c4D2Mg';
    const sheetName = 'Historical_Ride_Data'; // Update with your actual tab name
    const dataRange = `${sheetName}!A:H`;
    
    try {
        // Get existing rides to generate new ID
        console.log('Fetching existing rides...');
        const existingRides = await getExistingRides(spreadsheetId, dataRange);
        const newRideId = generateRideId(existingRides.slice(1)); // Skip header row
        
        console.log(`Generated new Ride ID: ${newRideId}`);
        
        // Prepare the new ride data
        const newRide = [
            newRideId,
            rideData.originLat,
            rideData.originLon,
            rideData.destLat,
            rideData.destLon,
            rideData.distance,
            rideData.timeOfDay,
            rideData.dayOfWeek
        ];
        
        console.log('\nNew ride data:');
        console.log(`  Ride ID: ${newRide[0]}`);
        console.log(`  Origin: (${newRide[1]}, ${newRide[2]})`);
        console.log(`  Destination: (${newRide[3]}, ${newRide[4]})`);
        console.log(`  Distance: ${newRide[5]} miles`);
        console.log(`  Time: ${newRide[6]}`);
        console.log(`  Day: ${newRide[7]}`);
        
        // Append the new ride
        console.log('\nAppending to sheet...');
        const result = await appendRow(spreadsheetId, dataRange, newRide);
        
        console.log('\n✓ Successfully added ride!');
        console.log(`  Updated range: ${result.updates.updatedRange}`);
        console.log(`  Rows added: ${result.updates.updatedRows}`);
        console.log(`  View at: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        
        return newRideId;
        
    } catch (error) {
        console.error('Error adding ride:', error.message);
        throw error;
    }
}

// Example usage - add a sample ride
if (require.main === module) {
    // Sample ride data
    const sampleRide = {
        originLat: 40.7589,
        originLon: -73.9851,
        destLat: 40.7614,
        destLon: -73.9776,
        distance: 5.2,
        timeOfDay: '14:30',
        dayOfWeek: 'Monday'
    };
    
    addHistoricalRide(sampleRide)
        .then(rideId => {
            console.log(`\n✓ Process complete. Ride ${rideId} added successfully.`);
        })
        .catch(err => {
            console.error('\n✗ Failed to add ride:', err.message);
            process.exit(1);
        });
}

module.exports = { addHistoricalRide, appendRow };
