import app from '../server.js';

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://acherniske.github.io'
];

function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return 'https://acherniske.github.io';
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin;
  if (requestOrigin.startsWith('https://acherniske.github.io')) return requestOrigin;
  return 'https://acherniske.github.io';
}

// Vercel serverless handler
export default async function handler(req, res) {
  const origin = getAllowedOrigin(req.headers.origin);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Pass to Express app - use a Promise wrapper for proper handling
    return new Promise((resolve, reject) => {
      app(req, res);
      
      // Listen for response finish
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Handler error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}