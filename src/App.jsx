import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TripDetail from './pages/TripDetail'
import NewTrip from './pages/NewTrip.jsx'
import Signup from './pages/Signup'
import ProtectedRoute from './ProtectedRoute'
import Landing from './pages/Landing'
import Profile from './pages/Profile'
import DemoTrip from './pages/DemoTrip'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trip/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
      <Route path="/new-trip" element={<ProtectedRoute><NewTrip /></ProtectedRoute>} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/demo" element={<ProtectedRoute><DemoTrip /></ProtectedRoute>} />
    </Routes>
  )
}