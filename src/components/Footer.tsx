import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-disclaimer">
        <Shield size={12} />
        <span>ZapPay is non-custodial — we never hold your funds.</span>
      </div>
      <div className="footer-links">
        <Link to="/terms">Terms of Service</Link>
        <span className="footer-sep">·</span>
        <span className="text-xs dim">&copy; {new Date().getFullYear()} ZapPay</span>
      </div>
    </footer>
  )
}
