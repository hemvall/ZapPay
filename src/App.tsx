import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/next"
import Home from './pages/Home'
import PayFlow from './pages/PayFlow'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pay/:id" element={<PayFlow />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
    
  )
}
