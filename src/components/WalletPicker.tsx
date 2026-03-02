import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, ChevronDown, X } from 'lucide-react'

const WALLET_ICONS: Record<string, string> = {
  metaMask: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  coinbaseWallet: 'https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-logo-300x300.webp',
  walletConnect: 'https://altcoinsbox.com/wp-content/uploads/2023/04/wallet-connect-logo-300x300.webp',
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function WalletPicker({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const { address, isConnected, connector: activeConnector } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="wp-connected">
        <button className="wp-account-btn" onClick={() => setOpen(!open)}>
          <Wallet size={14} />
          <span className="mono">{shortAddr(address)}</span>
          <ChevronDown size={12} style={{ opacity: 0.5 }} />
        </button>
        {open && (
          <>
            <div className="wp-backdrop" onClick={() => setOpen(false)} />
            <div className="wp-dropdown">
              <div className="wp-dropdown-header">
                <span className="text-xs muted">Connected via {activeConnector?.name}</span>
                <button className="wp-close" onClick={() => setOpen(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="wp-addr mono text-s">{address}</div>
              <button
                className="wp-disconnect-btn"
                onClick={() => { disconnect(); setOpen(false) }}
              >
                <LogOut size={14} /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="wp-connect">
      {!open ? (
        <button
          className={compact ? 'btn-primary' : 'btn-wallet'}
          onClick={() => setOpen(true)}
        >
          <Wallet size={15} /> Connect Wallet
        </button>
      ) : (
        <>
          <div className="wp-backdrop" onClick={() => setOpen(false)} />
          <div className="wp-modal">
            <div className="wp-modal-header">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Connect a wallet</h3>
              <button className="wp-close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="wp-list">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  className="wp-option"
                  disabled={isPending}
                  onClick={() => {
                    connect({ connector })
                    setOpen(false)
                  }}
                >
                  {connector.icon ? (
                    <img src={connector.icon} alt="" className="wp-option-icon" />
                  ) : WALLET_ICONS[connector.id] ? (
                    <img src={WALLET_ICONS[connector.id]} alt="" className="wp-option-icon" />
                  ) : (
                    <div className="wp-option-icon wp-option-icon-placeholder">
                      <Wallet size={18} />
                    </div>
                  )}
                  <span className="wp-option-name">{connector.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs dim text-c" style={{ padding: '8px 0 4px' }}>
              Choose your preferred wallet
            </p>
          </div>
        </>
      )}
    </div>
  )
}
