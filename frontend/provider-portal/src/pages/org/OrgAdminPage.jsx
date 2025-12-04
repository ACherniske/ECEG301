import { useParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { NavBar } from '../../components/navigation/NavBar'
import { useState, useEffect } from 'react'
import { Plus, Mail, Trash2, Shield, User, RefreshCw } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { SectionTitle } from '../../components/shared/SectionTitle'

export default function OrgAdminPage() {
  const { orgId } = useParams()
  const location = useLocation()
  const { organizationId, user } = useAuthStore()
  const [invitations, setInvitations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

  // Security check
  if (organizationId !== orgId) {
    return <div>Access Denied</div>
  }

  // Check if user has admin or dev role
  if (user?.role !== 'admin' && user?.role !== 'dev') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">You must be an administrator or developer to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  // Auto-refresh when page is accessed
  useEffect(() => {
    if (orgId) {
      // Clear any existing error/success messages when switching to this page
      setError('')
      setSuccess('')
      setShowInviteForm(false)
      
      // Fetch fresh data
      fetchData()
    }
  }, [orgId, location.pathname])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch invitations and users in parallel
      const [invResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/org/${orgId}/invitations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/org/${orgId}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (invResponse.ok) {
        const invData = await invResponse.json()
        setInvitations(invData)
      } else {
        console.error('Failed to fetch invitations:', await invResponse.text())
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      } else {
        console.error('Failed to fetch users:', await usersResponse.text())
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(`Failed to load data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/org/${orgId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        },
        body: JSON.stringify({
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          role: inviteData.role,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      const newInvitation = await response.json()
      setInvitations([...invitations, newInvitation])
      setSuccess(`Invitation sent to ${inviteData.email}`)
      setInviteData({ email: '', firstName: '', lastName: '', role: 'member' })
      setShowInviteForm(false)

      // Auto-refresh after invitation to catch any immediate acceptances
      setTimeout(() => {
        fetchData()
      }, 2000)

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Invitation error:', err)
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInvitation = async (invitationId) => {
    if (!confirm('Are you sure? This will revoke the invitation.')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/org/${orgId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invitation')
      }

      setInvitations(invitations.filter(inv => inv.id !== invitationId))
      setSuccess('Invitation revoked')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Delete invitation error:', err)
      setError(err.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure? This user will lose access.')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/org/${orgId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove user')
      }

      setUsers(users.filter(u => u.id !== userId))
      setSuccess('User removed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Delete user error:', err)
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
            <p className="text-gray-600">Manage organization members and invitations</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            {success}
          </div>
        )}

        {loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
            Loading data...
          </div>
        )}

        {/* Invite Section */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Invite New Members</SectionTitle>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              {showInviteForm ? 'Cancel' : 'Send Invitation'}
            </Button>
          </div>

          {showInviteForm && (
            <form onSubmit={handleInvite} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input 
                    type="text"
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData({...inviteData, firstName: e.target.value})}
                    placeholder="John"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input 
                    type="text"
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData({...inviteData, lastName: e.target.value})}
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  placeholder="provider@hospital.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select 
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Administrator</option>
                  <option value="dev">Developer</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <SectionTitle>Pending Invitations</SectionTitle>
          
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending invitations
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{inv.firstName} {inv.lastName}</p>
                      <p className="text-sm text-gray-600">{inv.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      {inv.role}
                    </span>
                    <button
                      onClick={() => handleDeleteInvitation(inv.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-2xl p-6">
          <SectionTitle>Active Users</SectionTitle>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active users
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {(u.role === 'admin' || u.role === 'dev') && (
                        <Shield size={18} className="text-blue-600" />
                      )}
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {u.role}
                      </span>
                    </div>
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}