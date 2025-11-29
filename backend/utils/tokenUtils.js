import crypto from 'crypto'

export function generateConfirmationToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function createConfirmationData(rideId, token) {
  return {
    rideId,
    token,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
  }
}