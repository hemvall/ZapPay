import { useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'

interface Props {
  expiresAt: string | null | undefined
  onExpired?: () => void
}

export default function ExpirationCountdown({ expiresAt, onExpired }: Props) {
  const { formatted, isExpired, secondsLeft } = useCountdown(expiresAt)
  const firedRef = useRef(false)

  useEffect(() => {
    if (isExpired && !firedRef.current) {
      firedRef.current = true
      onExpired?.()
    }
  }, [isExpired, onExpired])

  if (!expiresAt) return null

  if (isExpired) {
    return (
      <div className="expiration-bar expired">
        <Clock size={13} />
        <span>Expired</span>
      </div>
    )
  }

  const colorClass = secondsLeft < 120 ? 'danger' : secondsLeft < 300 ? 'warning' : ''

  return (
    <div className={`expiration-bar ${colorClass}`}>
      <Clock size={13} />
      <span>Expires in {formatted}</span>
    </div>
  )
}
