import { useState, useEffect } from 'react'

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,ethereum&vs_currencies=usd'

const CACHE_KEY = 'zappay_crypto_prices'
const CACHE_TTL = 60_000 // 1 minute

interface Prices {
  btc: number | null
  sol: number | null
  eth: number | null
}

interface CacheEntry {
  prices: Prices
  ts: number
}

function readCache(): Prices | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL) return null
    return entry.prices
  } catch {
    return null
  }
}

function writeCache(prices: Prices) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ prices, ts: Date.now() }))
}

export function useCryptoPrices() {
  const cached = readCache()
  const [prices, setPrices] = useState<Prices>(cached ?? { btc: null, sol: null, eth: null })
  const [loading, setLoading] = useState(cached === null)

  useEffect(() => {
    if (prices.btc !== null) return

    let cancelled = false
    fetch(COINGECKO_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const p: Prices = {
          btc: data?.bitcoin?.usd ?? null,
          sol: data?.solana?.usd ?? null,
          eth: data?.ethereum?.usd ?? null,
        }
        writeCache(p)
        setPrices(p)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [prices.btc])

  return { prices, loading }
}
