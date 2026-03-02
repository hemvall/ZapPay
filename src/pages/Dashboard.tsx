import { Wallet, Copy } from 'lucide-react'
import { shortAddr } from '../data/mock'

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
            <div className="dashboard">
                <h2>Dashboard</h2>
            </div>
            </div>
        </div>
    )
}
