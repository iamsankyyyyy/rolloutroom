import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
