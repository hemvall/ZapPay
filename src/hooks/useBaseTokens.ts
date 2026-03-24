import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'

export interface TokenEntry {
  ticker: string
  name: string
  balance: number
  usdValue: number
  price: number
  icon: string
  color: string
  glow: string
  decimals: number
  address: string | null // null = native ETH
}

interface BlockscoutToken {
  token: {
    address: string
    symbol: string
    name: string
    decimals: string
    icon_url?: string | null
    exchange_rate?: string | null
    type: string
  }
  value: string
}

const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2'

// Assign colors based on ticker
const TOKEN_COLORS: Record<string, { color: string; glow: string }> = {
  ETH: { color: '#627eea', glow: 'rgba(98,126,234,0.45)' },
  WETH: { color: '#627eea', glow: 'rgba(98,126,234,0.45)' },
  USDC: { color: '#2775ca', glow: 'rgba(39,117,202,0.45)' },
  USDbC: { color: '#2775ca', glow: 'rgba(39,117,202,0.45)' },
  USDT: { color: '#26a17b', glow: 'rgba(38,161,123,0.45)' },
  DAI: { color: '#f5ac37', glow: 'rgba(245,172,55,0.45)' },
  cbBTC: { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  DEGEN: { color: '#a855f7', glow: 'rgba(168,85,247,0.45)' },
  BRETT: { color: '#3b82f6', glow: 'rgba(59,130,246,0.45)' },
  TOSHI: { color: '#6366f1', glow: 'rgba(99,102,241,0.45)' },
  AERO: { color: '#0ea5e9', glow: 'rgba(14,165,233,0.45)' },
}

const DEFAULT_COLOR = { color: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' }

function getTokenColor(ticker: string) {
  return TOKEN_COLORS[ticker] || DEFAULT_COLOR
}

function iconForTicker(ticker: string): string {
  const map: Record<string, string> = {
    ETH: 'Ξ', WETH: 'Ξ', USDC: '$', USDbC: '$', USDT: '₮',
    DAI: '◈', cbBTC: '₿', DEGEN: '🎩', BRETT: '🐸', TOSHI: '🐱', AERO: '✈',
  }
  return map[ticker] || ticker.charAt(0).toUpperCase()
}

export function useBaseTokens(address: string | undefined, ethPrice: number | null) {
  const [tokens, setTokens] = useState<TokenEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) { setTokens([]); return }

    let cancelled = false
    setLoading(true)

    // Fetch native balance + ERC-20 tokens in parallel
    const fetchNative = fetch(`${BLOCKSCOUT_API}/addresses/${address}`)
      .then(r => r.json())
      .catch(() => null)

    const fetchTokens = fetch(`${BLOCKSCOUT_API}/addresses/${address}/tokens?type=ERC-20`)
      .then(r => r.json())
      .catch(() => null)

    Promise.all([fetchNative, fetchTokens]).then(([nativeData, tokenData]) => {
      if (cancelled) return

      const result: TokenEntry[] = []

      // Native ETH
      if (nativeData?.coin_balance) {
        const bal = Number(formatUnits(BigInt(nativeData.coin_balance), 18))
        const price = ethPrice || 0
        const colors = getTokenColor('ETH')
        result.push({
          ticker: 'ETH',
          name: 'Ethereum',
          balance: bal,
          usdValue: bal * price,
          price,
          icon: iconForTicker('ETH'),
          ...colors,
          decimals: 18,
          address: null,
        })
      }

      // ERC-20 tokens
      const items: BlockscoutToken[] = tokenData?.items || tokenData || []
      if (Array.isArray(items)) {
        for (const item of items) {
          const t = item.token
          if (!t || t.type !== 'ERC-20') continue
          const decimals = parseInt(t.decimals) || 18
          const bal = Number(formatUnits(BigInt(item.value || '0'), decimals))
          if (bal <= 0) continue

          const price = t.exchange_rate ? parseFloat(t.exchange_rate) : 0
          const usdValue = bal * price
          const ticker = t.symbol || '???'
          const colors = getTokenColor(ticker)

          result.push({
            ticker,
            name: t.name || ticker,
            balance: bal,
            usdValue,
            price,
            icon: iconForTicker(ticker),
            ...colors,
            decimals,
            address: t.address,
          })
        }
      }

      // Sort by USD value descending, then by balance
      result.sort((a, b) => b.usdValue - a.usdValue || b.balance - a.balance)

      setTokens(result)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [address, ethPrice])

  return { tokens, loading }
}
