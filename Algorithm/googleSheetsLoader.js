// Google Sheets Loader Utility
// Requires: npm install googleapis

const { google } = require('googleapis');
const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
    keyFile: 'APIKeys/sheetsAPIKey.json', // Update with your credentials file path
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function loadSheet(sheetId, range) {
    const client = await auth.getClient();
    const res = await sheets.spreadsheets.values.get({
        auth: client,
        spreadsheetId: sheetId,
        range: range,
    });
    return res.data.values; // Array of rows
}

module.exports = { loadSheet };
