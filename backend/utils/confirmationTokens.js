import { createConfirmationData } from './tokenUtils.js'

// Helper function to store confirmation token (you might want to use a database instead)
const confirmationTokens = new Map()

export const storeConfirmationToken = (rideId, token) => {
  const confirmationData = createConfirmationData(rideId, token)
  confirmationTokens.set(token, confirmationData)
  
  // Clean up expired tokens periodically
  setTimeout(() => {
    confirmationTokens.delete(token)
  }, 48 * 60 * 60 * 1000) // 48 hours
  
  return confirmationData
}

export const getConfirmationData = (token) => {
  return confirmationTokens.get(token)
}

export const deleteConfirmationToken = (token) => {
  return confirmationTokens.delete(token)
}
