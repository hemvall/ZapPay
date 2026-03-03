import { useState, useEffect, useCallback, useRef } from 'react'
import { Wallet, Loader2, Download, ExternalLink, Inbox, Filter, LogOut, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { shortAddr } from '../data/mock'
import { estimateFees } from '../hooks/estimateFees'
import { usePaymentSSE } from '../hooks/usePaymentSSE'
import type { Payment } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010'

const STATUSES = ['All', 'CREATED', 'PENDING', 'CONFIRMED', 'FAILED'] as const

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
  const header = 'Date,Amount,Token,Network,Fee,Status,TxHash,Recipient,Payer'
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
      p.payer || '',
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

export default function Dashboard() {
  const [address, setAddress] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const connected = address.length === 42

  // ─── Toasts ───
  interface Toast { id: number; payment: Payment }
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = useCallback((payment: Payment) => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, payment }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  // ─── Browser notification permission ───
  useEffect(() => {
    if (connected && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [connected])

  // ─── SSE ───
  const handleSSE = useCallback((payment: Payment) => {
    setPayments(prev => {
      const idx = prev.findIndex(p => p.id === payment.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = payment
        return next
      }
      return [payment, ...prev]
    })
    addToast(payment)
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification('ZapPay', {
        body: `Payment ${shortAddr(payment.id)} is now ${payment.status}`,
        icon: '/thunder.png',
      })
    }
  }, [addToast])

  usePaymentSSE(connected ? address : null, handleSSE)

  const disconnect = () => {
    setAddress('')
    setPayments([])
    setStatusFilter('All')
    setError('')
  }

  const connectWallet = async () => {
    try {
      const anyWindow = window as any
      if (anyWindow.ethereum && anyWindow.ethereum.request) {
        const accounts: string[] = await anyWindow.ethereum.request({ method: 'eth_requestAccounts' })
        const acc = accounts && accounts[0]
        if (acc) setAddress(acc)
      } else {
        alert('No Web3 wallet found. Please install MetaMask.')
      }
    } catch (err) {
      console.error('connectWallet error', err)
    }
  }

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
        setPayments(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [address, connected])

  const filtered = statusFilter === 'All'
    ? payments
    : payments.filter(p => p.status === statusFilter)

  // Summary stats — only CONFIRMED payments where user is recipient
  const confirmedReceived = payments.filter(
    p => p.status === 'CONFIRMED' && p.recipientAddress.toLowerCase() === address.toLowerCase()
  )
  const totalReceived = confirmedReceived.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const totalFees = confirmedReceived.reduce(
    (s, p) => s + estimateFees(parseFloat(p.amount) || 0, p.token, p.network), 0
  )

  const exportCsv = () => {
    const csv = buildCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `zappay-payments-${date}.csv`
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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Payment History</h2>
            <p className="text-xs muted" style={{ marginBottom: 20 }}>Connect your wallet to view your transactions</p>
            <button className="btn-primary" onClick={connectWallet}>
              <Wallet size={15} /> Connect Wallet
            </button>
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
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Dashboard</h2>
              <p className="text-xs muted mono">{shortAddr(address)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link to="/" className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>
                <Zap size={12} /> Create a payment
              </Link>
              <button className="btn-ghost" onClick={disconnect} style={{ fontSize: 13, color: '#ef4444' }}>
                <LogOut size={12} /> Disconnect
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="summary-grid">
            <div className="stat-card">
              <span className="stat-label">Total received</span>
              <span className="stat-value">${totalReceived.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Fees paid</span>
              <span className="stat-value">${totalFees.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{payments.length}</span>
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
              <p>No payments yet</p>
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
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const amt = parseFloat(p.amount) || 0
                    const fee = estimateFees(amt, p.token, p.network)
                    return (
                      <tr key={p.id}>
                        <td className="text-xs">{formatDate(p.createdAt)}</td>
                        <td>{p.amount} {p.token}</td>
                        <td className="muted">${fee.toFixed(2)}</td>
                        <td><span className={statusClass(p.status)}>{p.status}</span></td>
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
