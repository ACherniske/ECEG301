import { useState } from 'react'
import { Search, Loader, AlertCircle } from 'lucide-react'
import { Button } from '../shared/Button'
import { ehrService } from '../../services/ehrService'

export const PatientSearchStep = ({ organizationId, onPatientSelected, onLoading }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearchResults([])
    setLoading(true)
    onLoading(true)

    try {
      if (!searchQuery.trim()) {
        setError('Please enter a patient name or ID')
        return
      }

      const results = await ehrService.searchPatient(organizationId, searchQuery)
      setSearchResults(results)
      setSearched(true)

      if (results.length === 0) {
        setError('No patients found')
      }
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
      onLoading(false)
    }
  }

  const handleSelectPatient = (patient) => {
    onPatientSelected(patient)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
          Search Patient in EHR
        </h3>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name or ID
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., John Doe or P12345"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
          {loading ? 'Searching...' : 'Search EHR'}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Found {searchResults.length} patient(s):
          </p>
          {searchResults.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
              <div className="text-sm text-gray-600">ID: {patient.id}</div>
              <div className="text-sm text-gray-500">DOB: {patient.dateOfBirth}</div>
              <div className="text-sm text-gray-500">Phone: {patient.phone}</div>
              <div className="text-sm text-gray-500">Address: {patient.address}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}