import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, Wallet, CheckCircle, Shield } from 'lucide-react'

function BgElements() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="ring-deco ring-deco-1" />
      <div className="ring-deco ring-deco-2" />
    </>
  )
}

const steps = [
  {
    icon: Zap,
    title: 'Merchant generates a payment link',
    desc: 'Enter the amount, token, and network. ZapPay creates a unique payment link and QR code — no account or sign-up required.',
  },
  {
    icon: Wallet,
    title: 'Payer connects wallet and signs on-chain',
    desc: 'The payer opens the link, connects their own self-custodial wallet (MetaMask, Coinbase, etc.), reviews the details, and signs the transaction directly on the blockchain.',
  },
  {
    icon: CheckCircle,
    title: 'Payment confirmed, both parties notified',
    desc: 'Once the network confirms the transaction, both the merchant and payer see the updated status in real time. Funds go straight to the merchant\'s wallet — ZapPay never touches them.',
  },
]

export default function HowItWorks() {
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

        <div className="form-card fade-up" style={{ maxWidth: 640, textAlign: 'left' }}>
          <Link to="/" className="btn-ghost" style={{ marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back
          </Link>

          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How it Works</h1>
          <p className="text-xs muted" style={{ marginBottom: 24 }}>
            Three steps. No middleman. Fully on-chain.
          </p>

          <div className="terms-content">
            {steps.map((s, i) => (
              <section key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'var(--accent-bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <s.icon size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                </div>
                <div>
                  <h2 style={{ marginBottom: 4 }}>{s.title}</h2>
                  <p>{s.desc}</p>
                </div>
              </section>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              <strong style={{ fontSize: 13 }}>Non-Custodial Guarantee</strong>
            </div>
            <p className="text-xs muted">
              ZapPay never holds your funds. All transactions are peer-to-peer, executed directly
              on the blockchain through your own wallet. We cannot access, freeze, or move your assets.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>
              <Zap size={14} /> Create a payment
            </Link>
            <Link to="/terms" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>
              Read Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
