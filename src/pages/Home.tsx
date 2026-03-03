import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, QrCode, Share2, ArrowLeft, Shield, Loader2, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Crypto, Network } from '../types'
import { shortAddr } from '../data/mock'
import { estimateFees } from '../hooks/estimateFees'
import { useEthPrice, formatUsd } from '../hooks/useEthPrice'
import { useAccount, useDisconnect } from 'wagmi'
import WalletPicker from '../components/WalletPicker'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010'

const CRYPTOS: { id: Crypto; icon: string; logo: string; color: string }[] = [
  { id: 'ETH', icon: 'Ξ', logo: 'https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fethereum%2Fassets%2F0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2%2Flogo.png&anim=false&fit=cover&width=160&height=160', color: '#627eea' },
  { id: 'USDC', icon: '$', logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png', color: '#2775ca' },
  { id: 'USDT', icon: '₮', logo: 'https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fassets.phantom.app%2Fassets%2Fusdt.png&anim=true&fit=cover&width=60&height=60', color: '#26a17b' },
]

const NETWORKS: { id: Network; label: string; logo: string; sub: string }[] = [
  { id: 'Sepolia', label: 'Sepolia', logo: 'https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fethereum%2Fassets%2F0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2%2Flogo.png&anim=false&fit=cover&width=160&height=160', sub: 'Testnet' },
  { id: 'Base', label: 'Base', logo: 'https://assets-cdn.trustwallet.com/blockchains/base/info/logo.png', sub: 'Fast & cheap' },
  { id: 'Ethereum', label: 'Ethereum', logo: 'https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Ftrustwallet%2Fassets%40master%2Fblockchains%2Fethereum%2Fassets%2F0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2%2Flogo.png&anim=false&fit=cover&width=160&height=160', sub: 'Mainnet' },
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
  const [manualAddress, setManualAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [crypto, setCrypto] = useState<Crypto>('USDC')
  const [network, setNetwork] = useState<Network>('Sepolia')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [apiFees, setApiFees] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const { ethPrice } = useEthPrice()

  // wagmi wallet state
  const { address: walletAddress, isConnected: walletConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const address = walletConnected ? (walletAddress || '') : manualAddress

  const numAmount = parseFloat(amount) || 0
  const fees = numAmount > 0 ? estimateFees(numAmount, crypto, network) : 0
  const total = numAmount + fees
  const hasAddress = walletConnected || manualAddress.length >= 10
  const isValid = numAmount > 0 && hasAddress

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: String(numAmount),
          token: crypto,
          network: network.toLowerCase(),
          recipientAddress: address,
          merchantName: merchantName.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Server error (${res.status})`)
      }
      const data = await res.json()
      setPaymentLink(data.paymentUrl)
      setApiFees(data.estimatedFees)
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to create payment')
    } finally {
      setLoading(false)
    }
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
    setManualAddress('')
    if (walletConnected) disconnect()
    setPaymentLink('')
    setApiFees('')
    setMerchantName('')
    setError('')
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
                <div className="sum-row"><span className="sum-label">To</span><span className="sum-val">{merchantName.trim() || <span className="mono text-xs">{shortAddr(address)}</span>}</span></div>
                <div className="sum-row">
                  <span className="sum-label">Amount</span>
                  <span className="sum-val">
                    {amount} {crypto}
                    {crypto === 'ETH' && ethPrice && (
                      <span className="usd-conv"> ≈ {formatUsd(numAmount, ethPrice)}</span>
                    )}
                  </span>
                </div>
                <div className="sum-row"><span className="sum-label">Network</span><span className="sum-val">{network}</span></div>
                <div className="sum-row"><span className="sum-label">Fees</span><span className="sum-val">{apiFees || fees} {crypto}</span></div>
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
        </div>

        {/* Form */}
        <div className="form-card fade-up">
          <div className="brand-sub"><Shield size={10} /> Receive crypto in 2 clicks</div>

          {/* Merchant name */}
          <div className="field">
            <div className="field-label">Your name / Business name</div>
            <input
              className="input"
              placeholder="e.g. Acme Inc. (optional)"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>

          {/* Wallet / Address */}
          <div className="field">
            <div className="field-label">Receive to</div>
            <WalletPicker />
            <div className="field-or">or</div>
            <input
              className="input mono"
              placeholder="0x... paste address"
              value={walletConnected ? (walletAddress || '') : manualAddress}
              onChange={(e) => { setManualAddress(e.target.value); if (walletConnected) disconnect() }}
              disabled={walletConnected}
              style={walletConnected ? { opacity: 0.4 } : {}}
            />
          </div>

          {/* Token + Network */}
          <div className="field-row">
            <div className="field field-half">
              <div className="field-label">Network</div>
              <div className="toggles">
                {NETWORKS.map((n) => (
                  <button key={n.id} className={`tog ${network === n.id ? 'on' : ''}`} onClick={() => setNetwork(n.id)}>
                    <div className="tog-icon"><img src={n.logo} alt={n.label} /></div>
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
                      {c.logo ? <img src={c.logo} /> : c.icon}
                    </div>
                    <span className="tog-name">{c.id}</span>
                  </button>
                ))}
              </div>
            </div>
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

          {/* Summary */}
          {isValid && (
            <div className="summary fade-up">
              <div className="sum-row"><span className="sum-label">Amount</span><span className="sum-val">{amount} {crypto}</span></div>
              <div className="sum-row"><span className="sum-label">Fee ({network})</span><span className="sum-val">{fees} {crypto}</span></div>
              <hr className="sum-div" />
              <div className="sum-row sum-total">
                <span className="sum-label">Total</span>
                <span className="sum-val">
                  {total.toFixed(4)} {crypto}
                  {crypto === 'ETH' && ethPrice && (
                    <span className="usd-conv"> ≈ {formatUsd(total, ethPrice)}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          {error && <p className="text-xs" style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{error}</p>}
          <button className="btn-primary" onClick={handleGenerate} disabled={!isValid || loading}>
            {loading ? <><Loader2 size={15} className="spin" /> Creating...</> : <><QrCode size={15} /> Generate payment link</>}
          </button>
        </div>

        <div className="text-c" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Link to="/dashboard" className="btn-ghost" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LayoutDashboard size={16} /> View Dashboard
          </Link>
          <Link to="/how-it-works" className="btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            How it Works
          </Link>
        </div>
      </div>
    </div>
  )
}
