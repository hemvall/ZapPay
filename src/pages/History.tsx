import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Download, ExternalLink, Inbox, Filter, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { shortAddr } from '../data/mock'
import { estimateFees } from '../hooks/estimateFees'
import { useEthPrice } from '../hooks/useEthPrice'
import { usePaymentSSE } from '../hooks/usePaymentSSE'
import WalletPicker from '../components/WalletPicker'
import type { Payment } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010'

const STATUSES = ['All', 'PENDING', 'CONFIRMED', 'FAILED'] as const

const EXPLORER: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  base: 'https://basescan.org/tx/',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mo = months[d.getMonth()]
  const day = String(d.getDate()).padStart(2, '0')
  const yr = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${mo} ${day}, ${yr} ${hh}:${mm}`
}

function statusClass(s: string) {
  switch (s) {
    case 'CONFIRMED': return 'status-badge confirmed'
    case 'FAILED': return 'status-badge failed'
    default: return 'status-badge pending'
  }
}

function explorerUrl(network: string, hash: string) {
  const base = EXPLORER[network.toLowerCase()]
  return base ? `${base}${hash}` : '#'
}

function buildCsv(payments: Payment[]) {
  const header = 'Date,Amount,Token,Network,Fee,Status,TxHash,Recipient'
  const rows = payments.map(p => {
    const fee = estimateFees(parseFloat(p.amount) || 0, p.token, p.network)
    return [
      formatDate(p.createdAt),
      p.amount,
      p.token,
      p.network,
      fee,
      p.status,
      p.txHash || '',
      p.recipientAddress,
    ].map(v => `"${v}"`).join(',')
  })
  return header + '\n' + rows.join('\n')
}

function BgElements() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="ring-deco ring-deco-1" />
      <div className="ring-deco ring-deco-2" />
      <div className="particle-line pl-1" />
      <div className="particle-line pl-2" />
      <div className="particle-line pl-3" />
      <div className="particle-line pl-4" />
    </>
  )
}

function toUsd(amount: number, token: string, ethPrice: number | null): number {
  if (token.toLowerCase() === 'eth') return amount * (ethPrice || 0)
  return amount // USDC, USDT = 1:1
}

export default function History() {
  const { address, isConnected } = useAccount()
  const { ethPrice } = useEthPrice()
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const connected = isConnected && !!address

  // ─── Toasts ───
  interface Toast { id: number; payment: Payment }
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = useCallback((payment: Payment) => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, payment }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  // ─── SSE ───
  const handleSSE = useCallback((payment: Payment) => {
    setAllPayments(prev => {
      const idx = prev.findIndex(p => p.id === payment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = payment
        return next
      }
      return [payment, ...prev]
    })
    // Only toast if the payment is one we sent
    if (payment.payer?.toLowerCase() === address?.toLowerCase()) {
      addToast(payment)
    }
  }, [addToast, address])

  usePaymentSSE(connected ? address! : null, handleSSE)

  useEffect(() => {
    if (!connected) return
    const fetchPayments = async () => {
      setLoading(true)
      setError('')
      try {
        const url = `${API_URL}/payments/address/${address}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        const data: Payment[] = await res.json()
        setAllPayments(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [address, connected])

  // Filter to only sent payments (where user is the payer)
  const sentPayments = allPayments.filter(
    p => p.payer?.toLowerCase() === address?.toLowerCase()
  )

  const filtered = statusFilter === 'All'
    ? sentPayments
    : sentPayments.filter(p => p.status === statusFilter)

  // Summary stats
  const confirmedSent = sentPayments.filter(p => p.status === 'CONFIRMED' || p.txHash)
  const pendingSent = sentPayments.filter(p => !p.txHash && p.status === 'PENDING')

  const totalSent = confirmedSent.reduce(
    (s, p) => s + toUsd(parseFloat(p.amount) || 0, p.token, ethPrice), 0
  )
  const totalFees = confirmedSent.reduce(
    (s, p) => s + estimateFees(parseFloat(p.amount) || 0, p.token, p.network), 0
  )
  const pendingTotal = pendingSent.reduce(
    (s, p) => s + toUsd(parseFloat(p.amount) || 0, p.token, ethPrice), 0
  )

  const exportCsv = () => {
    const csv = buildCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `zappay-sent-payments-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Not connected ───
  if (!connected) {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          <div className="logo-center">
            <div className="logo-wrap">
              <div className="logo-glow" />
              <img src="/thunder.png" alt="" className="logo-img" />
            </div>
            <div className="brand-logo">Zap<span>Pay</span></div>
          </div>
          <div className="form-card fade-up text-c">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sent Payments</h2>
            <p className="text-xs muted" style={{ marginBottom: 20 }}>Connect your wallet to view your sent transactions</p>
            <WalletPicker compact />
            <Link to="/" className="btn-ghost" style={{ marginTop: 14, justifyContent: 'center' }}>
              <Zap size={12} /> Create a payment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Connected ───
  return (
    <div className="hero">
      <BgElements />
      <div className="hero-content dashboard">
        <div className="logo-center">
          <div className="logo-wrap">
            <div className="logo-glow" />
            <img src="/thunder.png" alt="" className="logo-img" />
          </div>
          <div className="brand-logo">Zap<span>Pay</span></div>
        </div>

        <div className="form-card fade-up">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Sent Payments</h2>
              <p className="text-xs muted mono">{shortAddr(address!)}</p>
            </div>
            <WalletPicker />
          </div>

          {/* Summary cards */}
          <div className="summary-grid">
            <div className="stat-card">
              <span className="stat-label">Total sent</span>
              <span className="stat-value">${totalSent.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending</span>
              <span className="stat-value">${pendingTotal.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Fees paid</span>
              <span className="stat-value">${totalFees.toFixed(2)}</span>
            </div>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={13} className="muted" />
              <select
                className="input"
                style={{ width: 'auto', padding: '7px 12px', fontSize: 12 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-secondary"
              style={{ width: 'auto', padding: '7px 14px', fontSize: 12 }}
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-c" style={{ padding: '40px 0' }}>
              <Loader2 size={24} className="spin muted" />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs" style={{ color: '#ef4444', textAlign: 'center', padding: '20px 0' }}>{error}</p>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <Inbox size={32} strokeWidth={1.5} />
              <p>No sent payments yet</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div className="table-wrap">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const amt = parseFloat(p.amount) || 0
                    const fee = estimateFees(amt, p.token, p.network)
                    const displayStatus = p.txHash ? 'CONFIRMED' : p.status
                    return (
                      <tr key={p.id}>
                        <td className="text-xs">{formatDate(p.createdAt)}</td>
                        <td>{p.amount} {p.token}</td>
                        <td className="mono text-xs">{shortAddr(p.recipientAddress)}</td>
                        <td><span className={statusClass(displayStatus)}>{displayStatus}</span></td>
                        <td>
                          {p.txHash ? (
                            <a
                              href={explorerUrl(p.network, p.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link mono text-xs"
                            >
                              {shortAddr(p.txHash)} <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Toast stack */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast toast-${t.payment.status.toLowerCase()}`}>
                <span className="toast-dot" />
                <span>
                  <strong>{shortAddr(t.payment.id)}</strong> &rarr; {t.payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
