import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

const OWNER_NAME = "Lew";
const APP_VERSION = "v2.4.1";
const BRAND_NAME = "ZapCard";

const CHAINS = {
  btc: {
    ticker: "BTC",
    name: "Bitcoin",
    icon: "₿",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.45)",
    price: 119700,
    balance: 86.24,
    pair: "BTC/USD",
    bars: [8, 14, 10, 18, 12, 22, 16, 20, 24, 18, 26, 20, 28],
  },
  sol: {
    ticker: "SOL",
    name: "Solana",
    icon: "◎",
    color: "#9945ff",
    glow: "rgba(153,69,255,0.45)",
    price: 168.4,
    balance: 4821.5,
    pair: "SOL/USD",
    bars: [10, 8, 16, 12, 20, 14, 18, 22, 16, 24, 20, 26, 22],
  },
  base: {
    ticker: "ETH",
    name: "Base (ETH)",
    icon: "Ξ",
    color: "#0052ff",
    glow: "rgba(0,82,255,0.45)",
    price: 2840.2,
    balance: 312.88,
    pair: "ETH/USD",
    bars: [12, 18, 10, 22, 16, 14, 20, 18, 24, 16, 22, 20, 26],
  },
};

const WALLETS = {
  btc: { label: "Bitcoin", sub: "BTC MAINNET", addr: "1A1zP1...Gpty", iconBg: "rgba(59,130,246,0.12)", icon: "₿", labelColor: "#93c5fd" },
  sol: { label: "Solana", sub: "SOL MAINNET", addr: "9xQeW6...3kNa", iconBg: "rgba(153,69,255,0.12)", icon: "◎", labelColor: "#c4b5fd" },
  base: { label: "Base", sub: "BASE L2", addr: "0x71C7...9e6b", iconBg: "rgba(0,82,255,0.12)", icon: "🔵", labelColor: "#93c5fd" },
};

const SPENDING_LIMITS = ["0.5 BTC", "1 BTC", "5 BTC", "NO LIMIT"];
const DEFAULT_LIMIT_INDEX = 2;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (n, min = 2, max = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });

const fmtUsd = (n) => "$ " + fmt(n);

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function CryptoCard() {
  const [tab, setTab] = useState("wallet");
  const [chain, setChain] = useState("btc");
  const [livePrice, setLivePrice] = useState(CHAINS.btc.price);
  const [nfcFlash, setNfcFlash] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [txData, setTxData] = useState({ amt: "", usd: "" });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [floatPaused, setFloatPaused] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(null);

  const livePriceRef = useRef(livePrice);
  const chainRef = useRef(chain);
  const cardRef = useRef(null);

  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);
  useEffect(() => { chainRef.current = chain; }, [chain]);

  // Live price sim
  useEffect(() => {
    const id = setInterval(() => {
      const c = CHAINS[chainRef.current];
      let p = livePriceRef.current;
      p += (Math.random() - 0.48) * (c.price * 0.0015);
      p = Math.max(c.price * 0.97, Math.min(c.price * 1.03, p));
      setLivePrice(p);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Reset price on chain switch
  useEffect(() => {
    setLivePrice(CHAINS[chain].price);
  }, [chain]);

  const c = CHAINS[chain];
  const balUsd = c.balance * livePrice;
  const change = ((livePrice - c.price * 0.98) / (c.price * 0.98) * 100).toFixed(2);
  const isUp = change >= 0;

  const triggerNFC = useCallback(() => {
    setNfcFlash(true);
    setTimeout(() => setNfcFlash(false), 750);
  }, []);

  const switchChain = useCallback((key) => {
    if (key === chain) return;
    setChain(key);
    triggerNFC();
  }, [chain, triggerNFC]);

  const simulateTx = useCallback((type) => {
    triggerNFC();
    setTimeout(() => {
      const amt = (Math.random() * 5 + 0.1).toFixed(4);
      const usd = fmt(amt * livePriceRef.current);
      setTxData({
        amt: (type === "recv" ? "+" : "") + amt + " " + CHAINS[chainRef.current].ticker,
        usd: "$ " + usd,
      });
      setTxActive(true);
      setTimeout(() => setTxActive(false), 2600);
    }, 350);
  }, [triggerNFC]);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    setTilt({ x: (e.clientX - cx) / 22, y: -(e.clientY - cy) / 22 });
    setFloatPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setFloatPaused(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const copyAddr = useCallback((key) => {
    setCopiedAddr(key);
    setTimeout(() => setCopiedAddr(null), 1500);
  }, []);

  // ─── Styles ───
  const cardTransform = floatPaused
    ? `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
    : undefined;

  const innerShadow = `0 0 0 1px ${c.color}20, 0 0 50px ${c.color}22, inset 0 1px 0 rgba(255,255,255,0.04), 0 50px 100px rgba(0,0,0,0.9)`;

  return (
    <div style={styles.body} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <style>{globalCSS}</style>
      <div style={styles.wrapper}>
        {/* NAV TABS */}
        <div style={styles.navTabs}>
          {["wallet", "settings"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.navTab,
                ...(tab === t ? styles.navTabActive : {}),
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ════════ WALLET VIEW ════════ */}
        {tab === "wallet" && (
          <div>
            {/* CARD */}
            <div style={styles.scene}>
              <div
                ref={cardRef}
                className={floatPaused ? "" : "card-float"}
                style={{ ...styles.card, transform: cardTransform }}
              >
                <div
                  style={{ ...styles.cardInner, borderColor: c.color + "44", boxShadow: innerShadow }}
                  onClick={() => simulateTx("send")}
                >
                  <div style={styles.cardGrid} />
                  <div style={{ ...styles.cornerAccent, background: `radial-gradient(circle at 0 0, ${c.color}18, transparent 70%)` }} />
                  {/* NFC Flash */}
                  <div
                    className={nfcFlash ? "nfc-flash-anim" : ""}
                    style={{
                      ...styles.nfcFlash,
                      background: `radial-gradient(circle at center, ${c.color}55, transparent 70%)`,
                      opacity: nfcFlash ? 1 : 0,
                    }}
                  />
                  {/* Shimmer overlay */}
                  <div className="card-shimmer" style={styles.shimmer} />
                  {/* NFC Rings */}
                  <div style={styles.nfcRings}>
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="1.5" fill="none" />
                      <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1" fill="none" />
                      <circle cx="20" cy="20" r="19" stroke="white" strokeWidth="0.6" fill="none" />
                    </svg>
                  </div>

                  {/* Card Content */}
                  <div style={styles.cardContent}>
                    <div style={styles.cardTop}>
                      <div>
                        <div style={styles.ownerLabel}>Card Owner</div>
                        <div style={styles.ownerName}>{OWNER_NAME}</div>
                      </div>
                      <div style={styles.liveBadge}>
                        <div className="live-blink" style={styles.liveDot} />
                        LIVE
                      </div>
                    </div>

                    <div style={styles.cardMiddle}>
                      <div style={styles.coinBlock}>
                        <div
                          style={{
                            ...styles.coinIcon,
                            background: `radial-gradient(circle, ${c.color}44, ${c.color}0d)`,
                            border: `1.5px solid ${c.color}88`,
                            boxShadow: `0 0 22px ${c.glow}, inset 0 0 10px ${c.color}1a`,
                            color: c.color,
                          }}
                        >
                          {c.icon}
                        </div>
                        <div>
                          <div style={{ ...styles.coinTicker, color: c.color }}>{c.ticker}</div>
                          <div style={styles.coinName}>{c.name}</div>
                        </div>
                      </div>
                      <div style={styles.balanceBlock}>
                        <div style={styles.balPriceSmall}>
                          ${fmt(livePrice)}
                        </div>
                        <div style={styles.balAmount}>
                          {c.balance.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                        </div>
                        <div style={{ ...styles.balUsd, color: c.color }}>
                          {fmtUsd(balUsd)}
                        </div>
                      </div>
                    </div>

                    <div style={styles.cardBottom}>
                      <div style={styles.sparkline}>
                        {c.bars.map((h, i) => (
                          <div
                            key={i}
                            style={{
                              width: 3,
                              height: h,
                              borderRadius: 2,
                              background: i === c.bars.length - 1 ? c.color : c.color + "66",
                              boxShadow: i === c.bars.length - 1 ? `0 0 6px ${c.color}` : "none",
                              transition: "height 0.8s ease, background 0.5s",
                            }}
                          />
                        ))}
                      </div>
                      <div style={styles.brand}>PRINT<br />WORLD</div>
                    </div>
                  </div>

                  {/* TX Overlay */}
                  <div
                    style={{
                      ...styles.txOverlay,
                      opacity: txActive ? 1 : 0,
                      pointerEvents: txActive ? "all" : "none",
                    }}
                  >
                    <div className="tx-check-pop" style={styles.txCheck}>
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={styles.txLabel}>Transaction<br />Complete</div>
                    <div>
                      <div style={styles.txCoinAmt}>{txData.amt}</div>
                      <div style={styles.txUsdAmt}>{txData.usd}</div>
                    </div>
                    <div style={{ ...styles.brand, opacity: 0.25, marginTop: 6 }}>PRINT WORLD</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chain Switcher */}
            <div style={styles.chainSwitcher}>
              {Object.entries(CHAINS).map(([key, ch]) => {
                const active = chain === key;
                return (
                  <button
                    key={key}
                    onClick={() => switchChain(key)}
                    style={{
                      ...styles.chainBtn,
                      ...(active
                        ? {
                            borderColor: ch.color + "55",
                            color: ch.color,
                            background: ch.color + "18",
                            boxShadow: `0 0 18px ${ch.color}22`,
                          }
                        : {}),
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: ch.color,
                        boxShadow: `0 0 6px ${ch.color}`,
                        flexShrink: 0,
                      }}
                    />
                    {ch.ticker}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={styles.actionRow}>
              <button style={{ ...styles.btn, ...styles.btnSend }} onClick={() => simulateTx("send")}>
                ⬆ SEND
              </button>
              <button style={{ ...styles.btn, ...styles.btnRecv }} onClick={() => simulateTx("recv")}>
                ⬇ RECEIVE
              </button>
            </div>

            {/* Ticker */}
            <div style={styles.ticker}>
              <span>{c.pair}</span>
              <span style={{ ...styles.tickerPrice, color: c.color }}>
                ${Math.round(livePrice).toLocaleString()}
              </span>
              <span style={{ ...styles.tickerChange, color: isUp ? "#22c55e" : "#ef4444" }}>
                {isUp ? "▲ +" : "▼ "}{change}%
              </span>
            </div>
          </div>
        )}

        {/* ════════ SETTINGS VIEW ════════ */}
        {tab === "settings" && (
          <div style={styles.settingsPanel}>
            <div style={styles.settingsHeader}>Settings</div>

            {/* Card Section */}
            <SettingsSection label="Card">
              <SettingsRow
                icon="💳"
                iconBg="rgba(59,130,246,0.1)"
                label="Card Name"
                sub={OWNER_NAME}
                right={<span style={{ color: "var(--muted)", fontSize: 18 }}>›</span>}
              />
              <SettingsRow
                icon="🔔"
                iconBg="rgba(245,158,11,0.1)"
                label="Transaction Alerts"
                sub="PUSH NOTIFICATIONS"
                right={<Toggle defaultOn />}
              />
              <SettingsRow
                icon="📶"
                iconBg="rgba(34,197,94,0.1)"
                label="NFC Payments"
                sub="TAP TO PAY"
                right={<Toggle defaultOn />}
              />
              <SettingsRow
                icon="🔒"
                iconBg="rgba(139,92,246,0.1)"
                label="Spending Limit"
                sub="PER TRANSACTION"
                right={
                  <select style={styles.srSelect} defaultValue={SPENDING_LIMITS[DEFAULT_LIMIT_INDEX]}>
                    {SPENDING_LIMITS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                }
              />
            </SettingsSection>

            {/* Wallets Section */}
            <SettingsSection label="Wallets">
              {Object.entries(WALLETS).map(([key, w]) => (
                <SettingsRow
                  key={key}
                  icon={w.icon}
                  iconBg={w.iconBg}
                  label={w.label}
                  labelColor={w.labelColor}
                  sub={w.sub}
                  right={
                    <div
                      onClick={() => copyAddr(key)}
                      style={{
                        ...styles.walletAddr,
                        color: copiedAddr === key ? "#22c55e" : undefined,
                      }}
                    >
                      {copiedAddr === key ? "COPIED ✓" : w.addr}
                    </div>
                  }
                />
              ))}
            </SettingsSection>

            {/* Security Section */}
            <SettingsSection label="Security">
              <SettingsRow
                icon="🛡️"
                iconBg="rgba(34,197,94,0.1)"
                label="Biometric Auth"
                sub="FACE ID / FINGERPRINT"
                right={<Toggle defaultOn />}
              />
              <SettingsRow
                icon="🔑"
                iconBg="rgba(245,158,11,0.1)"
                label="Backup Seed"
                sub="12-WORD PHRASE"
                right={<span style={{ color: "var(--muted)", fontSize: 18 }}>›</span>}
              />
              <SettingsRow
                icon="🗑️"
                iconBg="rgba(248,113,113,0.1)"
                label="Reset Card"
                labelColor="#f87171"
                sub="WIPE ALL DATA"
                right={<span style={{ color: "#f87171", fontSize: 18 }}>›</span>}
              />
            </SettingsSection>

            {/* About */}
            <div style={styles.aboutRow}>
              {[BRAND_NAME, APP_VERSION, "Privacy", "Support"].map((t, i) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {i > 0 && <span style={styles.aboutDot} />}
                  <span style={{ cursor: "pointer" }}>{t}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      onClick={() => setOn(!on)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
        background: on ? "#3b82f6" : "rgba(255,255,255,0.07)",
        border: `1px solid ${on ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
        transition: "all 0.3s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "transform 0.3s",
          transform: on ? "translateX(18px)" : "translateX(0)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

function SettingsSection({ label, children }) {
  return (
    <div style={styles.settingsSection}>
      <div style={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

function SettingsRow({ icon, iconBg, label, labelColor, sub, right }) {
  return (
    <div style={styles.settingsRow}>
      <div style={styles.srLeft}>
        <div style={{ ...styles.srIcon, background: iconBg }}>{icon}</div>
        <div>
          <div style={{ ...styles.srLabel, ...(labelColor ? { color: labelColor } : {}) }}>{label}</div>
          <div style={styles.srSub}>{sub}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GLOBAL CSS (animations + fonts)
// ═══════════════════════════════════════════════════════════

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');

:root {
  --muted: #475569;
  --muted2: #94a3b8;
  --text: #e2e8f0;
  --green: #22c55e;
}

@keyframes float {
  0%,100% { transform: translateY(0) rotateX(2deg) rotateY(-2deg); }
  50% { transform: translateY(-10px) rotateX(-1deg) rotateY(2deg); }
}
.card-float { animation: float 6s ease-in-out infinite; }

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

@keyframes ringout {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.6); opacity: 0; }
}
`;

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const font = {
  orbitron: "'Orbitron', monospace",
  mono: "'Share Tech Mono', monospace",
  body: "'Rajdhani', sans-serif",
};

const styles = {
  body: {
    background: "#040508",
    fontFamily: font.body,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    position: "relative",
  },
  navTabs: {
    display: "flex",
    gap: 2,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  navTab: {
    fontFamily: font.orbitron,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "8px 20px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
  navTabActive: {
    background: "rgba(255,255,255,0.07)",
    color: "#e2e8f0",
    boxShadow: "0 0 16px rgba(0,0,0,0.4)",
  },
  scene: { perspective: 1200 },
  card: {
    width: 440,
    height: 270,
    borderRadius: 24,
    position: "relative",
    cursor: "pointer",
    transformStyle: "preserve-3d",
    transition: "transform 0.1s",
  },
  cardInner: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    background: "linear-gradient(140deg, #0c1120 0%, #070c18 50%, #050810 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
    transition: "border-color 0.5s, box-shadow 0.5s",
  },
  cardGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
    borderRadius: 24,
  },
  cornerAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    borderRadius: "24px 0 0 0",
    transition: "background 0.5s",
  },
  nfcFlash: {
    position: "absolute",
    inset: 0,
    borderRadius: 24,
    pointerEvents: "none",
    zIndex: 20,
    transition: "opacity 0.3s",
  },
  shimmer: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)",
    pointerEvents: "none",
    zIndex: 3,
  },
  nfcRings: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    zIndex: 6,
    opacity: 0.12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    position: "relative",
    zIndex: 5,
    padding: "22px 26px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  ownerLabel: { fontFamily: font.mono, fontSize: 9, color: "#475569", letterSpacing: 2.5, textTransform: "uppercase" },
  ownerName: { fontFamily: font.orbitron, fontSize: 13, fontWeight: 600, color: "#e2e8f0", letterSpacing: 1, marginTop: 3 },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.25)",
    borderRadius: 20,
    padding: "5px 11px",
    fontFamily: font.mono,
    fontSize: 10,
    color: "#22c55e",
    letterSpacing: 1.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px #22c55e",
  },
  cardMiddle: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  coinBlock: { display: "flex", alignItems: "center", gap: 14 },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 900,
    transition: "all 0.5s",
  },
  coinTicker: { fontFamily: font.orbitron, fontSize: 20, fontWeight: 700, letterSpacing: 2, transition: "color 0.4s" },
  coinName: { fontFamily: font.body, fontSize: 12, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 },
  balanceBlock: { textAlign: "right" },
  balPriceSmall: { fontFamily: font.mono, fontSize: 10, color: "#475569", letterSpacing: 1 },
  balAmount: { fontFamily: font.orbitron, fontSize: 34, fontWeight: 700, color: "#e2e8f0", lineHeight: 1, margin: "3px 0", letterSpacing: -1 },
  balUsd: { fontFamily: font.mono, fontSize: 13, letterSpacing: 1, transition: "color 0.4s" },
  cardBottom: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  sparkline: { display: "flex", alignItems: "flex-end", gap: 3, height: 28 },
  brand: { fontFamily: font.orbitron, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.18)", textAlign: "right", lineHeight: 1.3, letterSpacing: 2 },
  txOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 24,
    background: "linear-gradient(140deg, #040e08, #060f06)",
    border: "1px solid rgba(34,197,94,0.35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 10,
    transition: "opacity 0.4s",
    boxShadow: "0 0 50px rgba(34,197,94,0.15), 0 50px 100px rgba(0,0,0,0.9)",
  },
  txCheck: {
    width: 62,
    height: 62,
    borderRadius: "50%",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 30px rgba(34,197,94,0.4)",
  },
  txLabel: { fontFamily: font.orbitron, fontSize: 15, fontWeight: 600, color: "#22c55e", letterSpacing: 1, textAlign: "center", lineHeight: 1.4 },
  txCoinAmt: { fontFamily: font.orbitron, fontSize: 28, fontWeight: 700, color: "#e2e8f0", textAlign: "center" },
  txUsdAmt: { fontFamily: font.mono, fontSize: 12, color: "#22c55e", marginTop: 4, textAlign: "center" },
  chainSwitcher: { display: "flex", gap: 8, marginTop: 18, justifyContent: "center" },
  chainBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: font.orbitron,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    padding: "9px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
  actionRow: { display: "flex", gap: 10, marginTop: 10, justifyContent: "center" },
  btn: {
    fontFamily: font.orbitron,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    padding: "11px 20px",
    borderRadius: 10,
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    textTransform: "uppercase",
  },
  btnSend: {
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.35)",
    color: "#93c5fd",
    boxShadow: "0 0 20px rgba(59,130,246,0.1)",
  },
  btnRecv: {
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.3)",
    color: "#86efac",
    boxShadow: "0 0 20px rgba(34,197,94,0.08)",
  },
  ticker: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: font.mono,
    fontSize: 11,
    color: "#475569",
    letterSpacing: 2,
  },
  tickerPrice: { fontSize: 14, margin: "0 6px", fontWeight: 700, transition: "color 0.4s" },
  tickerChange: { fontSize: 11 },
  // Settings
  settingsPanel: { width: 440, display: "flex", flexDirection: "column", gap: 0 },
  settingsHeader: {
    fontFamily: font.orbitron,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 3,
    color: "#475569",
    textTransform: "uppercase",
    padding: "0 0 14px 2px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 4,
  },
  settingsSection: {
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    background: "rgba(255,255,255,0.015)",
  },
  sectionLabel: {
    fontFamily: font.mono,
    fontSize: 9,
    color: "#475569",
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "14px 18px 4px",
    opacity: 0.6,
  },
  settingsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.2s",
  },
  srLeft: { display: "flex", alignItems: "center", gap: 12 },
  srIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  srLabel: { fontFamily: font.body, fontSize: 15, fontWeight: 600, color: "#e2e8f0", letterSpacing: 0.5 },
  srSub: { fontFamily: font.mono, fontSize: 10, color: "#475569", letterSpacing: 1, marginTop: 1 },
  srSelect: {
    fontFamily: font.mono,
    fontSize: 11,
    color: "#94a3b8",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    outline: "none",
    letterSpacing: 1,
  },
  walletAddr: {
    fontFamily: font.mono,
    fontSize: 10,
    color: "#475569",
    letterSpacing: 0.5,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: "5px 10px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  aboutRow: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    fontFamily: font.mono,
    fontSize: 10,
    color: "#475569",
    letterSpacing: 1.5,
  },
  aboutDot: {
    width: 3,
    height: 3,
    borderRadius: "50%",
    background: "#475569",
    opacity: 0.4,
  },
};