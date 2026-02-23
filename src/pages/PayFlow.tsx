import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Shield, ArrowRight, ExternalLink } from 'lucide-react'
import { useEthPrice, formatUsd } from '../hooks/useEthPrice'

export default function PayFlow() {
  const { id } = useParams()
  const [step, setStep] = useState<'summary' | 'processing' | 'done'>('summary')

  const { ethPrice } = useEthPrice()

  // Mock — in production fetched from backend by id
  const payment = { id, amount: 50, crypto: 'USDC', network: 'Base', recipient: '0x1a2b...9f3c', fees: 0.10 }
  const total = payment.amount + payment.fees
  const isEth = payment.crypto === 'ETH'

  const handlePay = () => {
    setStep('processing')
    setTimeout(() => setStep('done'), 3000)
  }

  // ─── Done ───
  if (step === 'done') {
    return (
      <div className="page">
        <div className="wrap">
          <div className="brand">
            <div className="brand-logo">Zap<span>Pay</span></div>
          </div>
          <div className="card fade-up text-c">
            <div className="success-circle">
              <Check size={30} style={{ color: 'var(--success)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Payment confirmed</h2>
            <p className="text-s muted mb-24">
              {payment.amount} {payment.crypto} sent successfully
              {isEth && ethPrice && <> ({formatUsd(payment.amount, ethPrice)})</>}
            </p>

            <div style={{ textAlign: 'left' }}>
              <div className="sum-row">
                <span className="sum-label">Transaction</span>
                <span className="sum-val mono text-s">0x8f3a...b21c</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">To</span>
                <span className="sum-val mono text-s">{payment.recipient}</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">Network</span>
                <span className="sum-val">{payment.network}</span>
              </div>
              <div className="sum-row">
                <span className="sum-label">Fees</span>
                <span className="sum-val">{payment.fees} {payment.crypto}</span>
              </div>
              <hr className="sum-div" />
              <div className="sum-row sum-total">
                <span className="sum-label">Total paid</span>
                <span className="sum-val">
                  {total.toFixed(2)} {payment.crypto}
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
      <div className="page">
        <div className="wrap">
          <div className="brand">
            <div className="brand-logo">Zap<span>Pay</span></div>
          </div>
          <div className="card fade-up text-c" style={{ padding: '48px 28px' }}>
            <div className="ring-spinner" />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Processing transaction</h2>
            <p className="text-s muted">Confirming on {payment.network}...</p>

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
    <div className="page">
      <div className="wrap">
        <div className="brand">
          <div className="brand-logo">Zap<span>Pay</span></div>
          <div className="brand-sub"><Shield size={12} /> Secure payment</div>
        </div>

        <div className="card fade-up">
          <div className="text-c mb-16">
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 10,
            }}>P</div>
            <p className="text-xs dim">Paying to</p>
            <p className="mono text-s muted">{payment.recipient}</p>
          </div>

          <div className="pay-hero">
            <div className="pay-amount">{payment.amount} {payment.crypto}</div>
            {isEth && ethPrice && (
              <p className="text-s muted" style={{ marginTop: 4 }}>
                ≈ {formatUsd(payment.amount, ethPrice)}
              </p>
            )}
            <p className="text-xs dim mt-6">on {payment.network}</p>
          </div>

          <div style={{ padding: '16px 0' }}>
            <div className="sum-row">
              <span className="sum-label">Amount</span>
              <span className="sum-val">{payment.amount} {payment.crypto}</span>
            </div>
            <div className="sum-row">
              <span className="sum-label">Network fee</span>
              <span className="sum-val">{payment.fees} {payment.crypto}</span>
            </div>
            <hr className="sum-div" />
            <div className="sum-row sum-total">
              <span className="sum-label">Total</span>
              <span className="sum-val">
                {total.toFixed(2)} {payment.crypto}
                {isEth && ethPrice && (
                  <span className="usd-conv"> ≈ {formatUsd(total, ethPrice)}</span>
                )}
              </span>
            </div>
          </div>

          <button className="btn-primary mt-8" onClick={handlePay}>
            Pay {total.toFixed(2)} {payment.crypto}
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
