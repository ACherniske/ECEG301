/**
 * Node.js script to run the Ride Acceptance Model with actual CSV files
 * Run with: node runModel.js
 */

const fs = require('fs');
const path = require('path');

// Import the model
const RideAcceptanceModel = require('./rideAcceptanceModel.js');

// Function to load CSV file
function loadCSV(filename) {
    try {
        const filePath = path.join(__dirname, 'Sample data', filename);
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        return null;
    }
}

function main() {
    console.log('Ride Acceptance Prediction Model - Running with actual data\n');
    
    // Load CSV files
    console.log('Loading data files...');
    const historicalData = loadCSV('Historical_Ride_Data.csv');
    const userData = loadCSV('User_Profile_Database.csv');
    const availableRides = loadCSV('Available_Rides_Pool.csv');
    
    if (!historicalData || !userData || !availableRides) {
        console.error('Failed to load one or more data files. Make sure the "Sample data" folder exists.');
        return;
    }
    
    console.log('Data loaded successfully!\n');
    
    // Initialize the model
    const model = new RideAcceptanceModel();
    model.loadData(historicalData, userData, availableRides);
    
    console.log(`Model initialized with:
   - ${model.historicalData.length} historical rides
   - ${model.userData.length} users
   - ${model.availableRides.length} available rides\n`);
    
    // Analyze each user
    console.log('='.repeat(80));
    console.log('USER ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    const allPredictions = [];
    const userAnalysis = [];
    
    model.userData.forEach(user => {
        const userId = user['User ID'];
        const historicalRate = parseFloat(user['Historical Ride Acceptance Rate']);
        
        console.log(`\nUser ${userId}`);
        console.log(`   Location: (${user['Current Latitude']}, ${user['Current Longitude']})`);
        console.log(`   Historical Acceptance Rate: ${(historicalRate * 100).toFixed(1)}%`);
        
        try {
            // Get top 5 recommendations
            const recommendations = model.getTopRecommendations(userId, 5);
            
            if (recommendations.length > 0) {
                console.log(`   \nTop ${recommendations.length} Ride Recommendations:`);
                
                recommendations.forEach((rec, index) => {
                    const probability = rec.probability;
                    const probPercent = (probability * 100).toFixed(1);
                    allPredictions.push(probability);
                    
                    // Add priority indicator based on probability
                    let priority = '[LOW]'; // Low
                    if (probability > 0.7) priority = '[HIGH]'; // High
                    else if (probability > 0.4) priority = '[MED]'; // Medium
                    
                    console.log(`   ${index + 1}. ${priority} Ride ${rec.rideId}: ${probPercent}% probability`);
                    console.log(`      Distance: ${rec.rideDetails['Distance (miles)']} miles | Time: ${rec.rideDetails['Scheduled Time (24hr)']} | From User: ${rec.features.distanceFromUser.toFixed(1)} miles`);
                });
                
                // Show detailed explanation for top recommendation
                const topRide = recommendations[0];
                console.log(`\n   Analysis of Top Recommendation (${topRide.rideId}):`);
                const explanation = model.explainPrediction(userId, topRide.rideId);
                Object.values(explanation.explanation).forEach(exp => {
                    console.log(`      ${exp}`);
                });
                
                userAnalysis.push({
                    userId,
                    historicalRate,
                    topPrediction: topRide.probability,
                    averagePrediction: recommendations.reduce((sum, r) => sum + r.probability, 0) / recommendations.length
                });
            } else {
                console.log('   No ride recommendations available');
            }
            
        } catch (error) {
            console.log(`   Error generating predictions: ${error.message}`);
        }
    });
    
    // Overall statistics
    console.log('\n' + '='.repeat(80));
    console.log('OVERALL ANALYSIS');
    console.log('='.repeat(80));
    
    if (allPredictions.length > 0) {
        const avgProbability = allPredictions.reduce((a, b) => a + b, 0) / allPredictions.length;
        const maxProbability = Math.max(...allPredictions);
        const minProbability = Math.min(...allPredictions);
        const highProbCount = allPredictions.filter(p => p > 0.7).length;
        const mediumProbCount = allPredictions.filter(p => p > 0.4 && p <= 0.7).length;
        const lowProbCount = allPredictions.filter(p => p <= 0.4).length;
        
        console.log(`Prediction Statistics:`);
        console.log(`   Total Predictions: ${allPredictions.length}`);
        console.log(`   Average Probability: ${(avgProbability * 100).toFixed(1)}%`);
        console.log(`   Highest Probability: ${(maxProbability * 100).toFixed(1)}%`);
        console.log(`   Lowest Probability: ${(minProbability * 100).toFixed(1)}%`);
        console.log(`   \nProbability Distribution:`);
        console.log(`   High (>70%): ${highProbCount} predictions (${(highProbCount/allPredictions.length*100).toFixed(1)}%)`);
        console.log(`   Medium (40-70%): ${mediumProbCount} predictions (${(mediumProbCount/allPredictions.length*100).toFixed(1)}%)`);
        console.log(`   Low (<40%): ${lowProbCount} predictions (${(lowProbCount/allPredictions.length*100).toFixed(1)}%)`);
    }
    
    // User pattern analysis
    if (userAnalysis.length > 0) {
        console.log(`\nUser Pattern Analysis:`);
        
        // Sort users by historical acceptance rate
        userAnalysis.sort((a, b) => b.historicalRate - a.historicalRate);
        
        console.log(`   Users ranked by historical acceptance rate:`);
        userAnalysis.forEach((user, index) => {
            const type = user.historicalRate > 0.7 ? 'High Accepter' : 
                        user.historicalRate > 0.4 ? 'Moderate Accepter' : 'Low Accepter';
            console.log(`   ${index + 1}. ${user.userId}: ${type} (Historical: ${(user.historicalRate * 100).toFixed(1)}%, Best Prediction: ${(user.topPrediction * 100).toFixed(1)}%)`);
        });
        
        // Correlation analysis
        const correlation = calculateCorrelation(
            userAnalysis.map(u => u.historicalRate),
            userAnalysis.map(u => u.topPrediction)
        );
        console.log(`\n   Correlation between historical rate and best prediction: ${correlation.toFixed(3)}`);
        console.log(`   ${correlation > 0.5 ? 'Strong positive correlation - model aligns well with historical patterns' : 
                      correlation > 0.2 ? 'Moderate correlation - model somewhat aligns with historical patterns' :
                      'Weak correlation - model may need adjustment'}`);
    }
    
    // Feature importance summary
    console.log(`\nFeature Importance (Model Coefficients):`);
    const sortedFeatures = Object.entries(model.coefficients)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    
    sortedFeatures.forEach(([feature, weight]) => {
        const impact = weight > 0 ? 'Increases' : 'Decreases';
        const strength = Math.abs(weight) > 1 ? 'Strong' : Math.abs(weight) > 0.5 ? 'Moderate' : 'Weak';
        console.log(`   ${feature}: ${weight.toFixed(3)} (${strength} ${impact.toLowerCase()} acceptance)`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('Analysis Complete!');
    console.log('To run the interactive web demo, open rideAcceptanceDemo.html in a browser');
    console.log('='.repeat(80));
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

// Run the main function
if (require.main === module) {
    main();
}