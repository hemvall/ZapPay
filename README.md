# CryptoPay MVP

UX-first crypto payment infrastructure designed to make paying with crypto as simple as Stripe.

## Vision

Enable anyone — novice or expert — to pay in crypto via link or QR code in **2 steps maximum**, with:

- Clear summary
- Transparent fees
- Live payment status
- Automatic wallet detection

---

## MVP Scope

### Core Features

**Payment Link + QR Generator**
- Enter amount
- Select currency (USDC, USDT, ETH)
- Select network (1–2 chains initially)
- Generate shareable link
- Generate QR code

**Wallet Detection**
- Automatic wallet detection
- Deep linking (MetaMask, WalletConnect, mobile wallets)
- Browser fallback
- Universal QR fallback

**2-Step Payment Flow**
1. Clear summary (amount, network, fees, total)
2. Confirm payment

**Live Status**
- Pending
- Confirmed
- Failed
- Expired

**Fee Estimation**
- Gas estimation
- Transparent breakdown
- Human-readable explanation

**Notifications**
- Email
- Webhook

**Dashboard**
- Payment history
- Status tracking
- Filters
- CSV export

---

## Architecture Principles

- Multi-chain ready from v1
- ChainAdapter abstraction layer
- No blockchain logic hardcoded
- Modular backend
- Horizontally scalable
- Production-ready code
- Upgradeable infrastructure
- Event-driven payment lifecycle

---

## High-Level Architecture

Frontend (Next.js)
↓
Backend API (Node.js / NestJS)
↓
Payment Service
↓
ChainAdapter Layer
↓
Blockchain (Ethereum / L2)

Supporting services:
- PostgreSQL
- Redis
- Queue (BullMQ / similar)
- Webhook dispatcher
- Email service

---