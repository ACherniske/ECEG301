import dotenv from 'dotenv'

dotenv.config()

console.log('=== ENV TEST ===')
console.log('EMAIL_USER:', process.env.EMAIL_USER)
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '[SET]' : '[NOT SET]')
console.log('NODE_ENV:', process.env.NODE_ENV)
