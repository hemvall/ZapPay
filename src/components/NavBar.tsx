import { Link, useLocation } from 'react-router-dom'
import { Zap, LayoutDashboard, SendHorizonal } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Create', icon: Zap },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'Sent', icon: SendHorizonal },
] as const

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="site-nav">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`nav-item ${pathname === to ? 'nav-active' : ''}`}
        >
          <Icon size={14} />
          <span>{label}</span>
        </Link>

      ))}
    </nav>
  )
}
