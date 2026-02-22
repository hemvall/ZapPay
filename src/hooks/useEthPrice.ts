import { useState, useEffect } from 'react'

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

const CACHE_KEY = 'zappay_eth_price'
const CACHE_TTL = 60_000 // 1 minute

interface CacheEntry {
  price: number
  ts: number
}

function readCache(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL) return null
    return entry.price
  } catch {
    return null
  }
}

function writeCache(price: number) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ price, ts: Date.now() }))
}

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(readCache)
  const [loading, setLoading] = useState(price === null)

  useEffect(() => {
    if (price !== null) return

    let cancelled = false
    fetch(COINGECKO_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const p = data?.ethereum?.usd
        if (typeof p === 'number') {
          writeCache(p)
          setPrice(p)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [price])

  return { ethPrice: price, loading }
}

export function formatUsd(ethAmount: number, ethPrice: number): string {
  const usd = ethAmount * ethPrice
  return usd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
