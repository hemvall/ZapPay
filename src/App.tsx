import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/next"
import { WagmiProvider } from './lib/WagmiProvider'
import Home from './pages/Home'
import PayFlow from './pages/PayFlow'
import Dashboard from './pages/Dashboard'
import Terms from './pages/Terms'
import Footer from './components/Footer'

export default function App() {
  return (
    <WagmiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pay/:id" element={<PayFlow />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
        <Footer />
        <Analytics />
      </BrowserRouter>
    </WagmiProvider>
  )
}
