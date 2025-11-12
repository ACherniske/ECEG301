# Ride Acceptance Prediction Model

A JavaScript-based machine learning model that predicts the probability a user will accept a ride based on historical patterns, using logistic regression principles.

## Features

The model considers multiple factors to predict ride acceptance:

### Distance-Related Features
- **Total Distance**: Length of the ride in miles
- **Distance from User**: How far the ride pickup is from the user's current location

### Temporal Patterns
- **Time of Day**: Peak hours (commute times) vs off-peak
- **Day of Week**: Weekdays vs weekends
- **Historical Time Preferences**: User's past ride timing patterns

### User Behavior Patterns
- **Overall Acceptance Rate**: User's historical acceptance percentage
- **Preferred Distances**: Rides matching user's typical distance preferences
- **Preferred Times**: Rides at user's preferred times of day

## Model Architecture

The model uses **logistic regression** to calculate acceptance probability:

```
P(accept) = 1 / (1 + e^(-z))

where z = β₀ + β₁×distance + β₂×userDistance + β₃×timeScore + β₄×dayScore + β₅×userRate + β₆×prefDistance + β₇×prefTime
```

### Current Model Coefficients
- **User Acceptance Rate**: 2.5 (strongest predictor)
- **Time of Day Score**: 0.8 (peak times boost acceptance)
- **Preferred Time**: 0.6 
- **Preferred Distance**: 0.4
- **Day of Week Score**: 0.3
- **Distance**: -0.15 (longer rides less likely)
- **Distance from User**: -0.25 (farther rides penalized)
- **Intercept**: -1.5 (baseline adjustment)

## 📁 File Structure

```
├── rideAcceptanceModel.js     # Core model implementation
├── predictionDemo.js          # Command-line demonstration
├── runModel.js               # Node.js script using actual CSV data
├── rideAcceptanceDemo.html   # Interactive web interface
└── Sample data/
    ├── Available_Rides_Pool.csv      # Current available rides
    ├── Historical_Ride_Data.csv      # Past ride data
    └── User_Profile_Database.csv     # User profiles with acceptance rates
```

## How to Use

### Option 1: Web Interface (Recommended)
1. Open `rideAcceptanceDemo.html` in your web browser
2. Select a user from the dropdown
3. Click "Get Ride Predictions" to see personalized recommendations
4. Use "Feature Analysis" to understand model weights
5. Use "Show Full Analysis" for comprehensive statistics

### Option 2: Node.js Command Line
```bash
node runModel.js
```
This will analyze all users and provide detailed console output.

### Option 3: Browser Console
```javascript
// Open rideAcceptanceDemo.html and use browser console
const model = new RideAcceptanceModel();
model.loadData(historicalData, userData, availableRides);

// Get recommendations for a specific user
const recommendations = model.getTopRecommendations('U001', 5);
console.log(recommendations);

// Explain a specific prediction
const explanation = model.explainPrediction('U001', 'A001');
console.log(explanation);
```

## Sample Output

```
 User U001
   Location: (40.81395, -76.34354)
   Historical Acceptance Rate: 81.0%
   
 Top 5 Ride Recommendations:
   1. Ride A001: 73.2% probability
      Distance: 6.15 miles | Time: 13:15 | From User: 5.4 miles
   2.  Ride A003: 68.9% probability
      Distance: 9.36 miles | Time: 10:00 | From User: 7.2 miles
```

##  Model Performance

The model provides interpretable predictions with:
- **Probability scores** from 0-1 for each user-ride pair
- **Feature importance** showing which factors most influence decisions
- **Detailed explanations** for each prediction
- **User segmentation** (High/Medium/Low accepters)

### Typical Results
- **High Accepters (>70% historical)**: Average best prediction ~75%
- **Moderate Accepters (40-70% historical)**: Average best prediction ~65%
- **Low Accepters (<40% historical)**: Average best prediction ~45%

##  Customization

### Adjusting Model Coefficients
Modify the `coefficients` object in `RideAcceptanceModel` constructor:

```javascript
this.coefficients = {
    intercept: -1.5,
    distance: -0.15,           // Adjust distance penalty
    distanceFromUser: -0.25,   // Adjust proximity importance
    timeOfDayScore: 0.8,       // Adjust time preference weight
    // ... other coefficients
};
```

### Adding New Features
1. Extract feature in `extractFeatures()` method
2. Add coefficient weight
3. Include in `calculateProbability()` linear combination

### Training with Real Data
To improve accuracy, implement the `updateCoefficients()` method with:
- Gradient descent optimization
- Cross-validation
- Performance metrics (accuracy, precision, recall, AUC)

##  Data Format

### Required CSV Structure

**User_Profile_Database.csv**
```csv
User ID,Current Latitude,Current Longitude,Historical Ride Acceptance Rate
U001,40.81395,-76.34354,0.81
```

**Available_Rides_Pool.csv**
```csv
Ride ID,Origin Latitude,Origin Longitude,Destination Latitude,Destination Longitude,Distance (miles),Scheduled Time (24hr)
A001,41.34901,-76.70262,40.61252,-77.15565,6.15,13:15
```

**Historical_Ride_Data.csv**
```csv
Ride ID,Origin Latitude,Origin Longitude,Destination Latitude,Destination Longitude,Distance (miles),Time of Day (24hr),Day of Week
R0001,40.83091,-77.15878,41.35899,-77.0563,9.15,12:00,Saturday
```

##  Technical Details

### Distance Calculation
Uses the Haversine formula for accurate geographic distance:
```javascript
const R = 3959; // Earth's radius in miles
const distance = R * 2 * Math.atan2(√a, √(1-a))
```

### Time Scoring
- **Peak hours** (6-9 AM, 4-7 PM): Score 1.0
- **Moderate hours** (9 AM-4 PM, 7-10 PM): Score 0.7  
- **Off-peak hours**: Score 0.3

### Day Scoring
- **Friday**: 1.0 (highest demand)
- **Tuesday-Thursday**: 0.9
- **Monday**: 0.8
- **Saturday**: 0.6
- **Sunday**: 0.5 (lowest demand)

##  Future Enhancements

1. **Real Training Data**: Implement supervised learning with actual acceptance/rejection data
2. **Advanced Features**: Weather, traffic conditions, surge pricing
3. **Deep Learning**: Neural networks for complex pattern recognition
4. **Real-time Updates**: Dynamic coefficient adjustment based on recent data
5. **A/B Testing**: Compare model performance against baselines
6. **Geographic Clustering**: Location-specific model variants

## 📝License

This project is for educational purposes. Feel free to modify and use for your ride-sharing analysis needs.

---