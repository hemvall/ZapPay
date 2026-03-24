import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

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

export default function Terms() {
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

          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Terms of Service</h1>
          <p className="text-xs muted" style={{ marginBottom: 24 }}>Last updated: March 2026</p>

          <div className="terms-content">
            <section>
              <h2>1. Non-Custodial Service</h2>
              <p>
                <strong>ZapPay never holds, controls, or has access to your funds.</strong> ZapPay is a
                non-custodial payment interface that facilitates direct, peer-to-peer cryptocurrency
                transactions on public blockchains. All transactions are executed directly between the
                payer's wallet and the recipient's wallet via smart contracts on the blockchain.
              </p>
              <p>
                At no point does ZapPay take custody, possession, or control of any digital assets.
                We do not operate wallets on behalf of users, and we cannot reverse, cancel, or
                modify any blockchain transaction once it has been submitted.
              </p>
            </section>

            <section>
              <h2>2. How ZapPay Works</h2>
              <p>ZapPay provides a user interface to:</p>
              <ul>
                <li>Generate payment links that encode transaction parameters (amount, token, network, recipient address)</li>
                <li>Display a payer-facing checkout page that interacts with the payer's own self-custodial wallet</li>
                <li>Track transaction status by reading public blockchain data</li>
              </ul>
              <p>
                ZapPay acts solely as a front-end tool. The actual transfer of funds occurs entirely
                on-chain, initiated and signed exclusively by the payer through their own wallet
                (e.g., MetaMask, Coinbase Wallet, WalletConnect-compatible wallets).
              </p>
            </section>

            <section>
              <h2>3. No Financial Intermediary</h2>
              <p>
                ZapPay does not act as a bank, money transmitter, payment processor, or financial
                intermediary of any kind. We do not:
              </p>
              <ul>
                <li>Hold, pool, or escrow user funds</li>
                <li>Execute transactions on behalf of users</li>
                <li>Convert between fiat currencies and cryptocurrencies</li>
                <li>Provide investment, financial, or tax advice</li>
                <li>Guarantee the value, delivery, or outcome of any transaction</li>
              </ul>
            </section>

            <section>
              <h2>4. User Responsibilities</h2>
              <p>By using ZapPay, you acknowledge and agree that:</p>
              <ul>
                <li>You are solely responsible for the security of your wallet and private keys</li>
                <li>You verify all transaction details (recipient address, amount, network) before signing</li>
                <li>Blockchain transactions are irreversible once confirmed</li>
                <li>You comply with all applicable laws and regulations in your jurisdiction</li>
                <li>You understand the risks of using cryptocurrency, including price volatility and potential loss</li>
              </ul>
            </section>

            <section>
              <h2>5. Platform Fees</h2>
              <p>
                ZapPay may charge a small platform fee on certain transactions. This fee is
                transparently displayed before you confirm any transaction and is sent to a
                separate on-chain address as part of the transaction you sign. The fee is never
                deducted from or routed through a custodial account.
              </p>
            </section>

            <section>
              <h2>6. No Warranty</h2>
              <p>
                ZapPay is provided "as is" without warranties of any kind. We do not guarantee
                uninterrupted access, error-free operation, or the accuracy of blockchain data
                displayed in the interface. Use ZapPay at your own risk.
              </p>
            </section>

            <section>
              <h2>7. Limitation of Liability</h2>
              <p>
                ZapPay and its contributors shall not be liable for any loss of funds, failed
                transactions, incorrect addresses, network fees, or any other damages arising
                from the use of this service. All on-chain interactions are final and governed
                by the respective blockchain protocol.
              </p>
            </section>

            <section>
              <h2>8. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. Continued use of ZapPay
                after changes constitutes acceptance of the updated terms.
              </p>
            </section>
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
        </div>
      </div>
    </div>
  )
}
