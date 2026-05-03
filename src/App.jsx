import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TripDetail from './pages/TripDetail'
import NewTrip from './pages/NewTrip.jsx'
import Signup from './pages/Signup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/trip/:id" element={<TripDetail />} />
      <Route path="/new-trip" element={<NewTrip />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}