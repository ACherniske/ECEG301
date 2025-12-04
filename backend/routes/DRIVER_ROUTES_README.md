# Driver Routes

Driver management and ride claiming functionality.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/org/:orgId/drivers` | List all drivers |
| GET | `/api/org/:orgId/drivers/:driverId` | Get driver details |
| POST | `/api/org/:orgId/drivers` | Create driver |
| PUT | `/api/org/:orgId/drivers/:driverId` | Update driver |
| GET | `/api/org/:orgId/drivers/:driverId/available-rides` | Get claimable rides |
| POST | `/api/org/:orgId/drivers/:driverId/claim-ride` | Claim a ride |

## Driver Object

```json
{
  "id": "DRV001",
  "name": "John Smith",
  "carMake": "Toyota",
  "carModel": "Camry",
  "licensePlate": "ABC123",
  "status": "active"
}
```

## Claim Ride Request

```json
{
  "rideId": "RIDE001"
}
```

## Sheet Structure

| Column | Field |
|--------|-------|
| A | Organization ID |
| B | Driver ID |
| C | Name |
| D | Car Make |
| E | Car Model |
| F | License Plate |
| G | Status |
