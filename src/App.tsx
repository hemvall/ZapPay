import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/next"
import { WagmiProvider } from './lib/WagmiProvider'
import Home from './pages/Home'
import PayFlow from './pages/PayFlow'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Terms from './pages/Terms'
import HowItWorks from './pages/HowItWorks'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  return (
    <WagmiProvider>
      <BrowserRouter>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pay/:id" element={<PayFlow />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
        <NavBar />
        
        <Footer />
        <ThemeToggle />
        <Analytics />
      </BrowserRouter>
    </WagmiProvider>
  )
}
