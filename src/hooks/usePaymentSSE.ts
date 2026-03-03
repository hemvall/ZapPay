import { useEffect, useRef } from 'react'
import type { Payment } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010'

export function usePaymentSSE(
  address: string | null,
  onEvent: (payment: Payment) => void,
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!address || address.length !== 42) return

    const url = `${API_URL}/payments/address/${address}/stream`
    const es = new EventSource(url)

    es.addEventListener('payment.status', (e: MessageEvent) => {
      try {
        const payment: Payment = JSON.parse(e.data)
        onEventRef.current(payment)
      } catch {
        // ignore malformed events
      }
    })

    return () => {
      es.close()
    }
  }, [address])
}
