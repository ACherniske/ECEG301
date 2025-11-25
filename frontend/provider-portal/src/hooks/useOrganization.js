import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export const useOrganization = () => {
  const { organization, organizationId, user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to organization dashboard if not already there
    if (isAuthenticated && organizationId && !window.location.pathname.includes(`/org/${organizationId}`)) {
      // This is handled by routing, but good to have as a safety check
    }
  }, [isAuthenticated, organizationId])

  return {
    organization,
    organizationId,
    isOrgMember: !!organizationId,
  }
}