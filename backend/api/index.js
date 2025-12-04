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
  if (!requestOrigin) return '*';
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin;
  if (requestOrigin.startsWith('https://acherniske.github.io')) return requestOrigin;
  return '*';
}

// Vercel serverless handler
export default async function handler(req, res) {
  const origin = getAllowedOrigin(req.headers.origin);
  
  // Set CORS headers for ALL responses FIRST
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle CORS preflight immediately - don't pass to Express
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass to Express app
  return app(req, res);
}