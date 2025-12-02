// Driver Routes Test
import http from 'http'

const baseUrl = 'http://localhost:3000'

// Mock authentication token (replace with actual token in testing)
const authToken = 'your-test-token'
const orgId = 'test-org-id'

const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(responseData || '{}')
        })
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

const testDriverRoutes = async () => {
  console.log('Testing Driver Routes...\n')

  try {
    // Test 1: Get all drivers
    console.log('1. Testing GET /api/org/:orgId/drivers')
    const driversResponse = await makeRequest(`/api/org/${orgId}/drivers`)
    console.log('Status:', driversResponse.statusCode)
    console.log('Data:', driversResponse.data)
    console.log()

    // Test 2: Create a new driver
    console.log('2. Testing POST /api/org/:orgId/drivers')
    const newDriver = {
      id: 'DRV001',
      name: 'John Smith',
      carMake: 'Toyota',
      carModel: 'Camry',
      licensePlate: 'ABC123'
    }
    const createResponse = await makeRequest(`/api/org/${orgId}/drivers`, 'POST', newDriver)
    console.log('Status:', createResponse.statusCode)
    console.log('Data:', createResponse.data)
    console.log()

    // Test 3: Get specific driver
    console.log('3. Testing GET /api/org/:orgId/drivers/:driverId')
    const driverResponse = await makeRequest(`/api/org/${orgId}/drivers/DRV001`)
    console.log('Status:', driverResponse.statusCode)
    console.log('Data:', driverResponse.data)
    console.log()

    // Test 4: Get available rides for driver
    console.log('4. Testing GET /api/org/:orgId/drivers/:driverId/available-rides')
    const availableRidesResponse = await makeRequest(`/api/org/${orgId}/drivers/DRV001/available-rides`)
    console.log('Status:', availableRidesResponse.statusCode)
    console.log('Data:', availableRidesResponse.data)
    console.log()

    // Test 5: Claim a ride (if available)
    if (availableRidesResponse.data.length > 0) {
      console.log('5. Testing POST /api/org/:orgId/drivers/:driverId/claim-ride')
      const ride = availableRidesResponse.data[0]
      const claimData = {
        rideId: ride.id,
        rowIndex: ride.rowIndex
      }
      const claimResponse = await makeRequest(`/api/org/${orgId}/drivers/DRV001/claim-ride`, 'POST', claimData)
      console.log('Status:', claimResponse.statusCode)
      console.log('Data:', claimResponse.data)
      console.log()
    }

    // Test 6: Get claimed rides
    console.log('6. Testing GET /api/org/:orgId/drivers/:driverId/claimed-rides')
    const claimedRidesResponse = await makeRequest(`/api/org/${orgId}/drivers/DRV001/claimed-rides`)
    console.log('Status:', claimedRidesResponse.statusCode)
    console.log('Data:', claimedRidesResponse.data)
    console.log()

    console.log('Driver route tests completed!')

  } catch (error) {
    console.error('Test error:', error)
  }
}

// Only run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDriverRoutes()
}

export { testDriverRoutes }
