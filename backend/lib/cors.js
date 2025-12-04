/**
 * CORS utility for Vercel serverless functions
 * Used as a fallback when Express CORS middleware doesn't apply
 */

const allowedOrigins = [
  'https://acherniske.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
]

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin
  
  // Check if origin matches allowed list or GitHub Pages domain
  if (origin && (allowedOrigins.includes(origin) || origin.startsWith('https://acherniske.github.io'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://acherniske.github.io')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}