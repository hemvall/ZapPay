import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/next"
import { WagmiProvider } from './lib/WagmiProvider'
import Home from './pages/Home'
import PayFlow from './pages/PayFlow'

export default function App() {
  return (
    <WagmiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pay/:id" element={<PayFlow />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </WagmiProvider>
  )
}
