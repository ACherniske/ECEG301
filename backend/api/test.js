// Simple test endpoint for verifying Vercel deployment
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Test endpoint working!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    env: process.env.NODE_ENV || 'development'
  })
}
