import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Shield, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { useEthPrice, formatUsd } from '../hooks/useEthPrice'
import { estimateFees } from '../hooks/estimateFees'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010'

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

const NETWORK_LOGOS: Record<string, string> = {
  ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  base: 'https://assets-cdn.trustwallet.com/blockchains/base/info/logo.png'
}

function getNetworkLogo(network: string): string | null {
  const key = network.toLowerCase().replace(/[\s-_]/g, '')
  for (const [name, url] of Object.entries(NETWORK_LOGOS)) {
    if (key.includes(name)) return url
  }
  return null
}

function NetworkBadge({ network }: { network: string }) {
  const logo = getNetworkLogo(network)
  if (!logo) return null
  return (
    <img
      src={logo}
      alt={network}
      style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 4, borderRadius: 4 }}
    />
  )
}

function Logo() {
  return (
    <div className="logo-center">
      <div className="logo-wrap">
        <div className="logo-glow" />
        <img src="/thunder.png" alt="" className="logo-img" />
      </div>
      <div className="brand-logo">Zap<span>Pay</span></div>
    </div>
  )
}

interface PaymentData {
  id: string
  amount: string
  token: string
  network: string
  recipientAddress: string
  label: string | null
  merchantName: string | null
  status: string
  txHash: string | null
  payer: string | null
}

export default function PayFlow() {
  const { id } = useParams()
  const [step, setStep] = useState<'summary' | 'processing' | 'done'>('summary')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { ethPrice } = useEthPrice()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${API_URL}/payments/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Payment not found' : 'Failed to fetch payment')
        return res.json()
      })
      .then(data => {
        setPaymentData(data)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          <Logo />
          <div className="form-card fade-up text-c" style={{ padding: '48px 28px' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <p className="text-s muted">Loading payment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          <Logo />
          <div className="form-card fade-up text-c" style={{ padding: '48px 28px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Payment not found</h2>
            <p className="text-s muted">{error || 'This payment link is invalid or has expired.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const amount = parseFloat(paymentData.amount)
  const fees = estimateFees(amount, paymentData.token, paymentData.network)
  const total = amount + fees
  const isEth = paymentData.token === 'ETH'

  const handlePay = () => {
    setStep('processing')
    setTimeout(() => setStep('done'), 3000)
  }

  // ─── Done ───
  if (step === 'done') {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          <Logo />
          <div className="form-card fade-up text-c">
            <div className="success-circle">
              <Check size={30} style={{ color: 'var(--success)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Payment confirmed</h2>
            <p className="text-s muted mb-24">
              {amount} {paymentData.token} sent successfully
              {isEth && ethPrice && <> ({formatUsd(amount, ethPrice)})</>}
            </p>

            <div style={{ textAlign: 'left' }}>
              <div className="sum-row">
                <span className="sum-label">Transaction</span>
                <span className="sum-val mono text-s">0x8f3a...b21c</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">To</span>
                <span className="sum-val">{paymentData.merchantName
                  ? <>{paymentData.merchantName} <span className="mono text-xs dim">({paymentData.recipientAddress.slice(0, 6)}...{paymentData.recipientAddress.slice(-4)})</span></>
                  : <span className="mono text-s">{paymentData.recipientAddress}</span>
                }</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">Network</span>
                <span className="sum-val">{paymentData.network}</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">Fees</span>
                <span className="sum-val">{fees} {paymentData.token}</span>
              </div>
              <hr className="sum-div" />
              <div className="sum-row sum-total">
                <span className="sum-label">Total paid</span>
                <span className="sum-val">
                  {total.toFixed(2)} {paymentData.token}
                  {isEth && ethPrice && (
                    <span className="usd-conv"> ≈ {formatUsd(total, ethPrice)}</span>
                  )}
                </span>
              </div>
            </div>

            <button className="btn-secondary mt-20">
              <ExternalLink size={14} /> View on explorer
            </button>
            <p className="text-xs dim mt-16">Recipient has been notified. You can close this page.</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Processing ───
  if (step === 'processing') {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          <Logo />
          <div className="form-card fade-up text-c" style={{ padding: '48px 28px' }}>
            <div className="ring-spinner" />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Processing transaction</h2>
            <p className="text-s muted">Confirming on {paymentData.network}...</p>

            <div className="step-list">
              {[
                { label: 'Wallet signed', done: true },
                { label: 'Transaction sent', done: true },
                { label: 'Network confirmation', done: false },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className={`step-dot ${s.done ? 'done' : 'wait'}`}>
                    {s.done ? <Check size={12} style={{ color: 'var(--success)' }} /> :
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', animation: 'pulse 1.5s ease infinite' }} />
                    }
                  </div>
                  <span className="text-s" style={{ fontWeight: 500, color: s.done ? 'var(--text)' : 'var(--text2)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>
    )
  }

  // ─── Summary ───
  return (
    <div className="hero">
      <BgElements />
      <div className="hero-content">
        <Logo />

        <div className="form-card fade-up">
          <div className="brand-sub"><Shield size={10} /> Secure payment</div>

          <div className="text-c mb-16">
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 10,
            }}>{paymentData.merchantName ? paymentData.merchantName.charAt(0).toUpperCase() : 'P'}</div>
            <p className="text-xs dim">Paying to</p>
            {paymentData.merchantName
              ? <p className="text-s" style={{ fontWeight: 600 }}>{paymentData.merchantName}</p>
              : <p className="mono text-s muted">{paymentData.recipientAddress}</p>
            }
          </div>

          <div className="pay-hero">
            <div className="pay-amount">{amount} {paymentData.token}</div>
            {isEth && ethPrice && (
              <p className="text-s muted" style={{ marginTop: 4 }}>
                ≈ {formatUsd(amount, ethPrice)}
              </p>
            )}
            <p className="text-xs dim mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              on {paymentData.network}
              <NetworkBadge network={paymentData.network} />
            </p>
          </div>

          <div style={{ padding: '16px 0' }}>
            <div className="sum-row">
              <span className="sum-label">Amount</span>
              <span className="sum-val">{amount} {paymentData.token}</span>
            </div>
            <div className="sum-row">
              <span className="sum-label">Network fee</span>
              <span className="sum-val">{fees} {paymentData.token}</span>
            </div>
            <hr className="sum-div" />
            <div className="sum-row sum-total">
              <span className="sum-label">Total</span>
              <span className="sum-val">
                {total.toFixed(2)} {paymentData.token}
                {isEth && ethPrice && (
                  <span className="usd-conv"> ≈ {formatUsd(total, ethPrice)}</span>
                )}
              </span>
            </div>
          </div>

          <button className="btn-primary mt-8" onClick={handlePay}>
            Pay {total.toFixed(2)} {paymentData.token}
            {isEth && ethPrice && <span className="text-xs" style={{ opacity: 0.7, marginLeft: 4 }}>({formatUsd(total, ethPrice)})</span>}
            {' '}<ArrowRight size={15} />
          </button>

          <p className="text-xs dim text-c mt-16">
            By confirming, you authorize the transfer from your connected wallet.
          </p>
        </div>
      </div>
    </div>
  )
}
