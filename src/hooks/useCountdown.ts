import { useState, useEffect } from 'react'

export function useCountdown(expiresAt: string | null | undefined) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!expiresAt) return Infinity
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()

    const tick = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = secondsLeft <= 0 && expiresAt != null
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { secondsLeft, formatted, isExpired }
}
