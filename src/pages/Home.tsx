import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Wallet, Copy, Check, QrCode, Share2, ArrowLeft, Zap, Shield } from 'lucide-react'
import type { Crypto, Network } from '../types'
import { estimateFees, generateId, shortAddr } from '../data/mock'

const CRYPTOS: { id: Crypto; icon: string; color: string }[] = [
  { id: 'USDC', icon: '$', color: '#2775ca' },
  { id: 'USDT', icon: '₮', color: '#26a17b' },
  { id: 'ETH', icon: 'Ξ', color: '#627eea' },
]

const NETWORKS: { id: Network; label: string; sub: string }[] = [
  { id: 'Base', label: 'Base', sub: 'Fast & cheap' },
  { id: 'Ethereum', label: 'Ethereum', sub: 'Mainnet' },
]

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

export default function Home() {
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [address, setAddress] = useState('')
  const [walletConnected, setWalletConnected] = useState(false)
  const [amount, setAmount] = useState('')
  const [crypto, setCrypto] = useState<Crypto>('USDC')
  const [network, setNetwork] = useState<Network>('Base')
  const [copied, setCopied] = useState(false)
  const [paymentId] = useState(generateId())

  const numAmount = parseFloat(amount) || 0
  const fees = numAmount > 0 ? estimateFees(numAmount, crypto, network) : 0
  const total = numAmount + fees
  const hasAddress = walletConnected || address.length >= 10
  const isValid = numAmount > 0 && hasAddress
  const paymentLink = `${window.location.origin}/pay/${paymentId}`

  const mockConnect = () => {
    setWalletConnected(true)
    setAddress('0x1a2b3c4d5e6f7890abcdef1234567890abcd9f3c')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Payment Link', url: paymentLink })
    } else {
      handleCopy()
    }
  }

  const reset = () => {
    setStep('form')
    setAmount('')
    setAddress('')
    setWalletConnected(false)
  }

  // ─── Result ───
  if (step === 'result') {
    return (
      <div className="hero">
        <BgElements />
        <div className="hero-content">
          {/* Logo centered */}
          <div className="logo-center">
            <div className="logo-wrap">
              <div className="logo-glow" />
              <img src="/thunder.png" alt="" className="logo-img" />
            </div>
            <div className="brand-logo">Zap<span>Pay</span></div>
          </div>

          <div className="form-card fade-up">
            <div className="card-top">
              <button className="btn-ghost" onClick={() => setStep('form')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>

            <div className="text-c" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Payment link ready</h2>
              <p className="text-xs muted">Share it to receive {amount} {crypto}</p>
            </div>

            <div className="result-layout">
              <div className="qr-box fade-up d1">
                <QRCodeSVG value={paymentLink} size={160} bgColor="#ffffff" fgColor="#06060b" level="M" />
              </div>

              <div className="result-right fade-up d2">
                <div className="sum-row"><span className="sum-label">To</span><span className="sum-val mono text-xs">{shortAddr(address)}</span></div>
                <div className="sum-row"><span className="sum-label">Amount</span><span className="sum-val">{amount} {crypto}</span></div>
                <div className="sum-row"><span className="sum-label">Network</span><span className="sum-val">{network}</span></div>
                <div className="sum-row"><span className="sum-label">Fees</span><span className="sum-val">{fees} {crypto}</span></div>
              </div>
            </div>

            <div className="link-bar fade-up d3">
              <span className="link-bar-url">{paymentLink}</span>
              <button className={`copy-btn ${copied ? 'ok' : ''}`} onClick={handleCopy}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>

            <div className="actions-row fade-up d3">
              <button className="btn-primary" onClick={handleCopy}>
                <Copy size={14} /> Copy link
              </button>
              <button className="share-btn" onClick={handleShare}>
                <Share2 size={15} style={{ color: 'var(--text2)' }} />
              </button>
            </div>

            <div className="text-c" style={{ marginTop: 12 }}>
              <button className="btn-ghost" onClick={reset}>Create another link</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form ───
  return (
    <div className="hero">
      <BgElements />
      <div className="hero-content">
        {/* Logo centered */}
        <div className="logo-center">
          <div className="logo-wrap">
            <div className="logo-glow" />
            <img src="/thunder.png" alt="" className="logo-img" />
          </div>
          <div className="brand-logo">Zap<span>Pay</span></div>
          <div className="brand-sub"><Shield size={10} /> Receive crypto in 2 clicks</div>
        </div>

        {/* Form */}
        <div className="form-card fade-up">
          {/* Wallet / Address */}
          <div className="field">
            <div className="field-label">Receive to</div>
            <button
              className={`btn-wallet ${walletConnected ? 'connected' : ''}`}
              onClick={mockConnect}
            >
              <Wallet size={15} />
              {walletConnected ? `Connected  ${shortAddr(address)}` : 'Connect Wallet'}
            </button>
            <div className="field-or">or</div>
            <input
              className="input mono"
              placeholder="0x... paste address"
              value={walletConnected ? address : address}
              onChange={(e) => { setAddress(e.target.value); setWalletConnected(false) }}
              disabled={walletConnected}
              style={walletConnected ? { opacity: 0.4 } : {}}
            />
          </div>

          {/* Amount */}
          <div className="field">
            <div className="field-label">Amount</div>
            <div className="amount-input">
              <button
                className="amount-btn"
                onClick={() => setAmount(String(Math.max(0, numAmount - 1)))}
                disabled={numAmount <= 0}
              >−</button>
              <input
                className="input input-big"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="any"
              />
              <button
                className="amount-btn"
                onClick={() => setAmount(String(numAmount + 1))}
              >+</button>
            </div>
          </div>

          {/* Token + Network */}
          <div className="field-row">
            <div className="field field-half">
              <div className="field-label">Network</div>
              <div className="toggles">
                {NETWORKS.map((n) => (
                  <button key={n.id} className={`tog ${network === n.id ? 'on' : ''}`} onClick={() => setNetwork(n.id)}>
                    <div className="tog-icon">{n.id === 'Base' ? <Zap size={12} /> : 'Ξ'}</div>
                    <span className="tog-name">{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field field-half">
              <div className="field-label">Token</div>
              <div className="toggles">
                {CRYPTOS.map((c) => (
                  <button key={c.id} className={`tog ${crypto === c.id ? 'on' : ''}`} onClick={() => setCrypto(c.id)}>
                    <div className="tog-icon" style={crypto === c.id ? { background: c.color + '22', color: c.color } : {}}>
                      {c.icon}
                    </div>
                    <span className="tog-name">{c.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {isValid && (
            <div className="summary fade-up">
              <div className="sum-row"><span className="sum-label">Amount</span><span className="sum-val">{amount} {crypto}</span></div>
              <div className="sum-row"><span className="sum-label">Fee ({network})</span><span className="sum-val">{fees} {crypto}</span></div>
              <hr className="sum-div" />
              <div className="sum-row sum-total"><span className="sum-label">Total</span><span className="sum-val">{total.toFixed(4)} {crypto}</span></div>
            </div>
          )}

          {/* CTA */}
          <button className="btn-primary" onClick={() => setStep('result')} disabled={!isValid}>
            <QrCode size={15} /> Generate payment link
          </button>
        </div>

        <p className="text-xs dim text-c" style={{ marginTop: 14 }}>No account needed. No data stored. Just crypto.</p>
      </div>
    </div>
  )
}
