import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const OWNER_NAME = 'Lew'

interface ChainData {
  ticker: string
  name: string
  icon: string
  color: string
  glow: string
  price: number
  balance: number
  pair: string
  bars: number[]
}

const CHAINS: Record<string, ChainData> = {
  btc: {
    ticker: 'BTC', name: 'Bitcoin', icon: '₿', color: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)', price: 119700, balance: 86.24, pair: 'BTC/USD',
    bars: [8, 14, 10, 18, 12, 22, 16, 20, 24, 18, 26, 20, 28],
  },
  sol: {
    ticker: 'SOL', name: 'Solana', icon: '◎', color: '#9945ff',
    glow: 'rgba(153,69,255,0.45)', price: 168.4, balance: 4821.5, pair: 'SOL/USD',
    bars: [10, 8, 16, 12, 20, 14, 18, 22, 16, 24, 20, 26, 22],
  },
  base: {
    ticker: 'ETH', name: 'Base (ETH)', icon: 'Ξ', color: '#0052ff',
    glow: 'rgba(0,82,255,0.45)', price: 2840.2, balance: 312.88, pair: 'ETH/USD',
    bars: [12, 18, 10, 22, 16, 14, 20, 18, 24, 16, 22, 20, 26],
  },
}

interface WalletData {
  label: string
  sub: string
  addr: string
  icon: string
}

const WALLETS: Record<string, WalletData> = {
  btc: { label: 'Bitcoin', sub: 'BTC MAINNET', addr: '1A1zP1...Gpty', icon: '₿' },
  sol: { label: 'Solana', sub: 'SOL MAINNET', addr: '9xQeW6...3kNa', icon: '◎' },
  base: { label: 'Base', sub: 'BASE L2', addr: '0x71C7...9e6b', icon: '🔵' },
}

const SPENDING_LIMITS = ['0.5 BTC', '1 BTC', '5 BTC', 'NO LIMIT']
const DEFAULT_LIMIT_INDEX = 2

const fmt = (n: number, min = 2, max = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max })

const fmtUsd = (n: number) => '$ ' + fmt(n)

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

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

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className={`zc-toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)}>
      <div className="zc-toggle-knob" />
    </div>
  )
}

function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="zc-settings-section">
      <div className="zc-section-label">{label}</div>
      {children}
    </div>
  )
}

function SettingsRow({ icon, label, labelColor, sub, right }: {
  icon: string
  label: string
  labelColor?: string
  sub: string
  right: ReactNode
}) {
  return (
    <div className="zc-settings-row">
      <div className="zc-sr-left">
        <div className="zc-sr-icon">{icon}</div>
        <div>
          <div className="zc-sr-label" style={labelColor ? { color: labelColor } : undefined}>{label}</div>
          <div className="zc-sr-sub">{sub}</div>
        </div>
      </div>
      {right}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function CryptoCard() {
  const [tab, setTab] = useState<'wallet' | 'settings'>('wallet')
  const [chain, setChain] = useState('btc')
  const [livePrice, setLivePrice] = useState(CHAINS.btc.price)
  const [nfcFlash, setNfcFlash] = useState(false)
  const [txActive, setTxActive] = useState(false)
  const [txData, setTxData] = useState({ amt: '', usd: '' })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [floatPaused, setFloatPaused] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null)

  const livePriceRef = useRef(livePrice)
  const chainRef = useRef(chain)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => { livePriceRef.current = livePrice }, [livePrice])
  useEffect(() => { chainRef.current = chain }, [chain])

  useEffect(() => {
    const id = setInterval(() => {
      const ch = CHAINS[chainRef.current]
      let p = livePriceRef.current
      p += (Math.random() - 0.48) * (ch.price * 0.0015)
      p = Math.max(ch.price * 0.97, Math.min(ch.price * 1.03, p))
      setLivePrice(p)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { setLivePrice(CHAINS[chain].price) }, [chain])

  const c = CHAINS[chain]
  const balUsd = c.balance * livePrice
  const change = ((livePrice - c.price * 0.98) / (c.price * 0.98) * 100).toFixed(2)
  const isUp = Number(change) >= 0

  const triggerNFC = useCallback(() => {
    setNfcFlash(true)
    setTimeout(() => setNfcFlash(false), 750)
  }, [])

  const switchChain = useCallback((key: string) => {
    if (key === chain) return
    setChain(key)
    triggerNFC()
  }, [chain, triggerNFC])

  const simulateTx = useCallback((type: 'send' | 'recv') => {
    triggerNFC()
    setTimeout(() => {
      const amt = (Math.random() * 5 + 0.1).toFixed(4)
      const usd = fmt(Number(amt) * livePriceRef.current)
      setTxData({
        amt: (type === 'recv' ? '+' : '') + amt + ' ' + CHAINS[chainRef.current].ticker,
        usd: '$ ' + usd,
      })
      setTxActive(true)
      setTimeout(() => setTxActive(false), 2600)
    }, 350)
  }, [triggerNFC])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    setTilt({ x: (e.clientX - cx) / 22, y: -(e.clientY - cy) / 22 })
    setFloatPaused(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setReleasing(true)
    setTilt({ x: 0, y: 0 })
    setFloatPaused(false)
    setTimeout(() => setReleasing(false), 500)
  }, [])

  const copyAddr = useCallback((key: string) => {
    setCopiedAddr(key)
    setTimeout(() => setCopiedAddr(null), 1500)
  }, [])

  return (
    <div className="hero" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <style>{cardCSS}</style>
      <BgElements />
      <div className="hero-content" style={{ maxWidth: 540 }}>

        {/* Logo */}
        <div className="logo-center">
          <div className="logo-wrap">
            <div className="logo-glow" />
            <img src="/thunder.png" alt="" className="logo-img" />
          </div>
          <div className="brand-logo">Zap<span>Card</span></div>
        </div>

        {/* Nav Tabs */}
        <div className="zc-nav-tabs">
          {(['wallet', 'settings'] as const).map((t) => (
            <button key={t} className={`zc-nav-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ════════ WALLET ════════ */}
        {tab === 'wallet' && (
          <div className="fade-up">
            {/* 3D Card */}
            <div className="zc-scene">
              <div
                ref={cardRef}
                className={`zc-tilt-wrapper ${releasing ? 'releasing' : ''}`}
                style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
              >
                <div className="zc-card zc-float">
                  <div
                    className="zc-card-inner"
                    style={{
                      borderColor: c.color + '44',
                      boxShadow: `0 0 0 1px ${c.color}20, 0 0 50px ${c.color}22, inset 0 1px 0 rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.7)`,
                    }}
                    onClick={() => simulateTx('send')}
                  >
                    <div className="zc-card-grid" />
                    <div className="zc-corner-accent" style={{ background: `radial-gradient(circle at 0 0, ${c.color}18, transparent 70%)` }} />
                    <div
                      className={nfcFlash ? 'zc-nfc-flash nfc-flash-anim' : 'zc-nfc-flash'}
                      style={{
                        background: `radial-gradient(circle at center, ${c.color}55, transparent 70%)`,
                        opacity: nfcFlash ? 1 : 0,
                      }}
                    />
                    <div className="zc-shimmer card-shimmer" />
                    <div className="zc-nfc-rings">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="1.5" fill="none" />
                        <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1" fill="none" />
                        <circle cx="20" cy="20" r="19" stroke="white" strokeWidth="0.6" fill="none" />
                      </svg>
                    </div>

                    {/* Card Content */}
                    <div className="zc-card-content">
                      <div className="zc-card-top">
                        <div>
                          <div className="zc-owner-label">Card Owner</div>
                          <div className="zc-owner-name">{OWNER_NAME}</div>
                        </div>
                        <div className="zc-live-badge">
                          <div className="zc-live-dot live-blink" />
                          LIVE
                        </div>
                      </div>

                      <div className="zc-card-middle">
                        <div className="zc-coin-block">
                          <div
                            className="zc-coin-icon"
                            style={{
                              background: `radial-gradient(circle, ${c.color}44, ${c.color}0d)`,
                              border: `1.5px solid ${c.color}88`,
                              boxShadow: `0 0 22px ${c.glow}, inset 0 0 10px ${c.color}1a`,
                              color: c.color,
                            }}
                          >
                            {c.icon}
                          </div>
                          <div>
                            <div className="zc-coin-ticker" style={{ color: c.color }}>{c.ticker}</div>
                            <div className="zc-coin-name">{c.name}</div>
                          </div>
                        </div>
                        <div className="zc-balance-block">
                          <div className="zc-bal-amount">
                            {c.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                          </div>
                          <div className="zc-bal-usd" style={{ color: c.color }}>
                            {fmtUsd(balUsd)}
                          </div>
                        </div>
                      </div>

                      <div className="zc-card-bottom">
                        <div className="zc-sparkline">
                          {c.bars.map((h, i) => (
                            <div
                              key={i}
                              className="zc-spark-bar"
                              style={{
                                height: h,
                                background: i === c.bars.length - 1 ? c.color : c.color + '66',
                                boxShadow: i === c.bars.length - 1 ? `0 0 6px ${c.color}` : 'none',
                              }}
                            />
                          ))}
                        </div>
                        <div className="zc-brand">ZAPCARD</div>
                      </div>
                    </div>

                    {/* TX Overlay */}
                    <div className={`zc-tx-overlay ${txActive ? 'active' : ''}`}>
                      <div className="tx-check-pop zc-tx-check">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="zc-tx-label">Transaction<br />Complete</div>
                      <div>
                        <div className="zc-tx-amt">{txData.amt}</div>
                        <div className="zc-tx-usd">{txData.usd}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chain pills */}
            <div className="zc-chain-switcher">
              {Object.entries(CHAINS).map(([key, ch]) => (
                <button
                  key={key}
                  className={`zc-chain-btn ${chain === key ? 'on' : ''}`}
                  onClick={() => switchChain(key)}
                  style={chain === key ? { borderColor: ch.color + '55', color: ch.color, background: ch.color + '12' } : undefined}
                >
                  <span className="zc-chain-dot" style={{ background: ch.color, boxShadow: `0 0 6px ${ch.color}` }} />
                  {ch.ticker}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="zc-action-row">
              <button className="btn-primary zc-action-btn" onClick={() => simulateTx('send')}>
                ⬆ Send
              </button>
              <button className="btn-secondary zc-action-btn" onClick={() => simulateTx('recv')}>
                ⬇ Receive
              </button>
            </div>

            {/* Ticker */}
            <div className="zc-ticker">
              <span className="zc-ticker-price" style={{ color: c.color }}>
                {c.pair} ${Math.round(livePrice).toLocaleString()}
              </span>
              <span style={{ color: isUp ? 'var(--success)' : '#ef4444' }}>
                {isUp ? '▲+' : '▼'}{change}%
              </span>
            </div>
          </div>
        )}

        {/* ════════ SETTINGS ════════ */}
        {tab === 'settings' && (
          <div className="fade-up">
            <SettingsSection label="Card">
              <SettingsRow icon="💳" label="Card Name" sub={OWNER_NAME}
                right={<span className="text-s muted">›</span>} />
              <SettingsRow icon="🔔" label="Transaction Alerts" sub="PUSH NOTIFICATIONS"
                right={<Toggle defaultOn />} />
              <SettingsRow icon="📶" label="NFC Payments" sub="TAP TO PAY"
                right={<Toggle defaultOn />} />
              <SettingsRow icon="🔒" label="Spending Limit" sub="PER TRANSACTION"
                right={
                  <select className="zc-select" defaultValue={SPENDING_LIMITS[DEFAULT_LIMIT_INDEX]}>
                    {SPENDING_LIMITS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                } />
            </SettingsSection>

            <SettingsSection label="Wallets">
              {Object.entries(WALLETS).map(([key, w]) => (
                <SettingsRow key={key} icon={w.icon} label={w.label} sub={w.sub}
                  right={
                    <div
                      className={`zc-wallet-addr ${copiedAddr === key ? 'copied' : ''}`}
                      onClick={() => copyAddr(key)}
                    >
                      {copiedAddr === key ? 'COPIED ✓' : w.addr}
                    </div>
                  }
                />
              ))}
            </SettingsSection>

            <SettingsSection label="Security">
              <SettingsRow icon="🛡️" label="Biometric Auth" sub="FACE ID / FINGERPRINT"
                right={<Toggle defaultOn />} />
              <SettingsRow icon="🔑" label="Backup Seed" sub="12-WORD PHRASE"
                right={<span className="text-s muted">›</span>} />
              <SettingsRow icon="🗑️" label="Reset Card" labelColor="#f87171" sub="WIPE ALL DATA"
                right={<span style={{ color: '#f87171' }}>›</span>} />
            </SettingsSection>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════

const cardCSS = `
/* Nav tabs */
.zc-nav-tabs {
  display: flex; gap: 2px; justify-content: center;
  background: var(--elevated); border: 1px solid var(--border);
  border-radius: var(--r); padding: 3px;
  width: fit-content; margin: 0 auto 20px;
}
.zc-nav-tab {
  font-size: 12px; font-weight: 600;
  padding: 6px 16px; border-radius: 9px;
  color: var(--text3); transition: all 0.2s var(--ease);
}
.zc-nav-tab.on { background: var(--card); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.15); }

/* Chain switcher */
.zc-chain-switcher { display: flex; gap: 6px; justify-content: center; margin-bottom: 10px; }
.zc-chain-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
  padding: 8px 12px; border-radius: var(--r-sm);
  border: 1px solid var(--border); background: var(--bg);
  color: var(--text3); cursor: pointer; transition: all 0.2s var(--ease);
}
.zc-chain-btn:hover { border-color: var(--border-h); }
.zc-chain-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}

/* Action row */
.zc-action-row { display: flex; gap: 8px; margin-bottom: 12px; }
.zc-action-btn { flex: 1; padding: 10px 16px; font-size: 13px; }

/* Ticker */
.zc-ticker {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 12px; color: var(--text3);
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  padding-bottom: 8px;
}
.zc-ticker-price { font-weight: 700; transition: color 0.4s; }

/* 3D Card */
.zc-scene { perspective: 1200px; margin-bottom: 14px; }
.zc-tilt-wrapper {
  transform-style: preserve-3d;
  transition: transform 0.08s linear;
}
.zc-tilt-wrapper.releasing {
  transition: transform 0.5s ease-out;
}
.zc-card {
  width: 100%; aspect-ratio: 528 / 324;
  border-radius: 20px; position: relative; cursor: pointer;
  transform-style: preserve-3d;
}
.zc-card-inner {
  width: 100%; height: 100%; border-radius: 20px;
  border: 1px solid var(--border); overflow: hidden;
  position: relative; transition: border-color 0.5s, box-shadow 0.5s;
}
.zc-card-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 44px 44px; border-radius: 20px;
}
.zc-corner-accent {
  position: absolute; top: 0; left: 0;
  width: 80px; height: 80px; border-radius: 20px 0 0 0;
  transition: background 0.5s;
}
.zc-nfc-flash {
  position: absolute; inset: 0; border-radius: 20px;
  pointer-events: none; z-index: 20; transition: opacity 0.3s;
}
.zc-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%);
  pointer-events: none; z-index: 3;
}
.zc-nfc-rings {
  position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px; z-index: 6; opacity: 0.12;
  display: flex; align-items: center; justify-content: center;
}

/* Card content */
.zc-card-content {
  position: relative; z-index: 5;
  padding: 20px 22px; height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
}
.zc-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.zc-owner-label {
  font-size: 9px; color: var(--text3); letter-spacing: 2.5px;
  text-transform: uppercase; font-family: 'SF Mono', Monaco, Consolas, monospace;
}
.zc-owner-name {
  font-size: 13px; font-weight: 700; color: var(--text);
  letter-spacing: 1px; margin-top: 3px;
}
.zc-live-badge {
  display: flex; align-items: center; gap: 6px;
  background: var(--success-bg); border: 1px solid rgba(34,197,94,0.25);
  border-radius: 20px; padding: 5px 11px;
  font-size: 10px; color: var(--success); letter-spacing: 1.5px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}
.zc-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 6px var(--success);
}
.zc-card-middle { display: flex; justify-content: space-between; align-items: flex-end; }
.zc-coin-block { display: flex; align-items: center; gap: 12px; }
.zc-coin-icon {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; transition: all 0.5s;
}
.zc-coin-ticker {
  font-size: 18px; font-weight: 800; letter-spacing: 2px; transition: color 0.4s;
}
.zc-coin-name {
  font-size: 11px; color: var(--text3); letter-spacing: 2px;
  text-transform: uppercase; margin-top: 2px;
}
.zc-balance-block { text-align: right; }
.zc-bal-amount {
  font-size: 28px; font-weight: 800; color: var(--text);
  line-height: 1; margin: 3px 0; letter-spacing: -1px;
}
.zc-bal-usd {
  font-size: 13px; letter-spacing: 1px; transition: color 0.4s;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}
.zc-card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
.zc-sparkline { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
.zc-spark-bar {
  width: 3px; border-radius: 2px;
  transition: height 0.8s ease, background 0.5s;
}
.zc-brand {
  font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.18);
  text-align: right; line-height: 1.3; letter-spacing: 2px;
}

/* TX Overlay */
.zc-tx-overlay {
  position: absolute; inset: 0; border-radius: 20px;
  background: linear-gradient(140deg, #040e08, #060f06);
  border: 1px solid rgba(34,197,94,0.35);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  z-index: 10; transition: opacity 0.4s;
  box-shadow: 0 0 50px rgba(34,197,94,0.15), 0 50px 100px rgba(0,0,0,0.9);
  opacity: 0; pointer-events: none;
}
.zc-tx-overlay.active { opacity: 1; pointer-events: all; }
.zc-tx-check {
  width: 62px; height: 62px; border-radius: 50%;
  border: 2px solid var(--success);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 30px rgba(34,197,94,0.4);
}
.zc-tx-label {
  font-size: 14px; font-weight: 700; color: var(--success);
  letter-spacing: 1px; text-align: center; line-height: 1.4;
}
.zc-tx-amt {
  font-size: 24px; font-weight: 800; color: var(--text); text-align: center;
}
.zc-tx-usd {
  font-size: 12px; color: var(--success); margin-top: 4px; text-align: center;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

/* Settings */
.zc-settings-section {
  border: 1px solid var(--border); border-radius: var(--r);
  overflow: hidden; margin-bottom: 12px; background: var(--card);
}
.zc-section-label {
  font-size: 10px; color: var(--text3); letter-spacing: 1.5px;
  text-transform: uppercase; padding: 14px 16px 4px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}
.zc-settings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}
.zc-settings-row:last-child { border-bottom: none; }
.zc-sr-left { display: flex; align-items: center; gap: 12px; }
.zc-sr-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; background: var(--elevated);
}
.zc-sr-label { font-size: 14px; font-weight: 600; color: var(--text); }
.zc-sr-sub {
  font-size: 10px; color: var(--text3); letter-spacing: 1px; margin-top: 1px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

/* Toggle */
.zc-toggle {
  width: 42px; height: 24px; border-radius: 12px;
  position: relative; cursor: pointer;
  background: var(--elevated); border: 1px solid var(--border);
  transition: all 0.3s; flex-shrink: 0;
}
.zc-toggle.on { background: var(--accent); border-color: var(--accent); }
.zc-toggle-knob {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform 0.3s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.zc-toggle.on .zc-toggle-knob { transform: translateX(18px); }

/* Select */
.zc-select {
  font-size: 11px; color: var(--text2);
  background: var(--elevated); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 6px 10px;
  cursor: pointer; outline: none; letter-spacing: 1px;
}

/* Wallet addr */
.zc-wallet-addr {
  font-size: 10px; color: var(--text3); letter-spacing: 0.5px;
  background: var(--elevated); border-radius: var(--r-sm);
  padding: 5px 10px; cursor: pointer;
  transition: all 0.2s; border: 1px solid var(--border);
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}
.zc-wallet-addr:hover { border-color: var(--border-h); }
.zc-wallet-addr.copied { color: var(--success); border-color: var(--success); }

/* Animations */
@keyframes zcFloat {
  0%,100% { transform: translateY(0) rotateX(2deg) rotateY(-2deg); }
  50% { transform: translateY(-10px) rotateX(-1deg) rotateY(2deg); }
}
.zc-float { animation: zcFloat 6s ease-in-out infinite; }

@keyframes shimmer {
  0%,100% { opacity: 0; transform: translateX(-120%); }
  50% { opacity: 1; transform: translateX(150%); }
}
.card-shimmer { animation: shimmer 5s ease-in-out infinite; }

@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.live-blink { animation: blink 2s ease infinite; }

@keyframes nfcpop {
  0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; }
}
.nfc-flash-anim { animation: nfcpop 0.7s ease forwards; }

@keyframes checkpop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.tx-check-pop { animation: checkpop 0.5s ease 0.15s both; }

/* Light mode */
[data-theme="light"] .zc-card-grid {
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
}
[data-theme="light"] .zc-brand { color: rgba(0,0,0,0.12); }
[data-theme="light"] .zc-tx-overlay {
  background: linear-gradient(140deg, #f0fdf4, #ecfdf5);
  border-color: rgba(34,197,94,0.3);
}
[data-theme="light"] .zc-tx-amt { color: var(--text); }
`
