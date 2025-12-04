import app from '../server.js';

// Vercel serverless handler
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://acherniske.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  try {
    // Pass to Express app
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}