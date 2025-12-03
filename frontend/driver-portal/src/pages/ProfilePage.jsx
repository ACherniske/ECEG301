import { BottomNav } from '../components/shared/BottomNav'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
      <BottomNav />
    </div>
  )
}