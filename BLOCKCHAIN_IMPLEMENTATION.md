# ZapPay — Blockchain Implementation Guide

## Table of Contents

1. [Current State](#1-current-state)
2. [Architecture Overview](#2-architecture-overview)
3. [Payment Flow (End-to-End)](#3-payment-flow-end-to-end)
4. [Chain Adapter Layer (Backend)](#4-chain-adapter-layer-backend)
5. [Fee Model & ZapPay Revenue](#5-fee-model--zappay-revenue)
6. [Frontend Wallet Integration](#6-frontend-wallet-integration)
7. [Transaction Lifecycle & Status Machine](#7-transaction-lifecycle--status-machine)
8. [Confirmation Polling / Event Listening](#8-confirmation-polling--event-listening)
9. [Security Considerations](#9-security-considerations)
10. [Environment Variables Needed](#10-environment-variables-needed)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Current State

| Layer | Status |
|-------|--------|
| **Prisma schema** (`Payment` model) | Done — has `amount`, `token`, `network`, `recipientAddress`, `status`, `txHash`, `payer` |
| **API endpoints** (create / get / list) | Done — Express routes in `api/routes/` |
| **Frontend merchant page** (`Home.tsx`) | Done — form, QR code, copy link |
| **Frontend payer page** (`PayFlow.tsx`) | Done — but **payment is simulated** (3-second fake delay, hardcoded fake tx hash) |
| **Chain adapters** (`api/chain/`) | **Empty files** — `chainAdapter.interface.ts`, `ethereum.adapter.js`, `base.adapter.js` are all 0 bytes |
| **Wallet connection** | Basic `window.ethereum.request` only — no wagmi/viem yet |
| **Fee logic** | Frontend `estimateFees.ts` has tiered USD logic; backend has flat `NETWORK_FEES` map — **they don't match** |
| **Queue / workers** | Not implemented |
| **SSE / real-time status** | Not implemented |

**Bottom line:** The UI is ready, the DB is ready, but **nothing touches the blockchain yet**.

---

## 2. Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────────┐
│  Frontend    │  POST   │   Express    │  Prisma │   PostgreSQL     │
│  (React)     │────────>│   API        │────────>│   (Supabase)     │
│              │  GET    │              │         │                  │
│  wagmi/viem  │<────────│  chain/      │         │  Payment table   │
│  AppKit      │   SSE   │  adapters    │         │                  │
└──────┬───────┘         └──────┬───────┘         └──────────────────┘
       │                        │
       │  sendTransaction()     │  viem publicClient
       │  (user's wallet)       │  (read-only: poll confirmations)
       ▼                        ▼
┌──────────────────────────────────────┐
│         EVM Blockchain               │
│   (Ethereum mainnet, Base, etc.)     │
└──────────────────────────────────────┘
```

**Key principle:** The **payer's wallet** signs and sends the transaction (frontend). The **backend never holds private keys** — it only reads the chain to confirm the tx landed.

---

## 3. Payment Flow (End-to-End)

```
MERCHANT                       API                        PAYER                      BLOCKCHAIN
   │                            │                           │                            │
   │  POST /payments            │                           │                            │
   │  {amount, token,           │                           │                            │
   │   network, recipient}      │                           │                            │
   │ ─────────────────────────> │                           │                            │
   │                            │ create Payment            │                            │
   │                            │ status = CREATED          │                            │
   │  <── paymentUrl + QR ───── │                           │                            │
   │                            │                           │                            │
   │       (shares link)        │                           │                            │
   │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ > │                            │
   │                            │                           │                            │
   │                            │  GET /pay/:id             │                            │
   │                            │ <──────────────────────── │                            │
   │                            │ ──── payment details ──── │                            │
   │                            │                           │                            │
   │                            │                           │  connect wallet            │
   │                            │                           │  review amount + fees      │
   │                            │                           │                            │
   │                            │                           │  sendTransaction() ──────> │
   │                            │                           │     (native ETH)           │
   │                            │                           │  OR                        │
   │                            │                           │  token.transfer() ────────>│
   │                            │                           │     (ERC-20)               │
   │                            │                           │                            │
   │                            │                           │  <── txHash ────────────── │
   │                            │                           │                            │
   │                            │  PATCH /payments/:id      │                            │
   │                            │  {txHash, payer}          │                            │
   │                            │ <──────────────────────── │                            │
   │                            │ status = PENDING          │                            │
   │                            │                           │                            │
   │                            │  poll / waitForReceipt    │                            │
   │                            │ ─────────────────────────────────────────────────────> │
   │                            │ <── receipt (success) ─────────────────────────────── │
   │                            │ status = CONFIRMED        │                            │
   │                            │                           │                            │
   │                            │  SSE: payment.status ──── │                            │
   │                            │  ──> "CONFIRMED"          │                            │
```

### Steps in detail

1. **Merchant creates a payment** via `POST /payments` with the desired amount, token, network, and their wallet address.
2. **API stores** the payment in DB with `status = CREATED` and returns a shareable link + QR.
3. **Payer opens the link**, sees the payment details, and connects their wallet.
4. **Frontend calculates the total** = merchant amount + ZapPay platform fee + estimated gas.
5. **Payer approves** the transaction in their wallet. The frontend uses **viem/wagmi** to either:
   - `sendTransaction` for native ETH, or
   - call `transfer()` on the ERC-20 contract for USDC/USDT.
6. **Frontend receives the txHash** and sends it to the API via `PATCH /payments/:id`.
7. **API updates status to PENDING** and starts polling the chain for confirmation.
8. **Once confirmed**, status becomes `CONFIRMED` and the payer is notified via SSE.

---

## 4. Chain Adapter Layer (Backend)

The empty files in `api/chain/` need to be filled. Use **viem** (already chosen for this project — NOT ethers.js).

### 4.1 Interface

```ts
// api/chain/chainAdapter.interface.ts

export interface TransactionReceipt {
  txHash: string;
  status: 'success' | 'reverted';
  blockNumber: bigint;
  from: string;
  to: string;
  gasUsed: bigint;
}

export interface ChainAdapter {
  /** Human-readable chain name */
  readonly name: string;

  /** Wait for a tx to be mined and return the receipt */
  waitForTransaction(txHash: string): Promise<TransactionReceipt>;

  /** Get current block number */
  getBlockNumber(): Promise<bigint>;

  /** Check if an address has enough balance for a given token+amount */
  getBalance(address: string, tokenAddress?: string): Promise<bigint>;

  /** Estimate gas cost in native token (wei) */
  estimateGasCost(): Promise<bigint>;
}
```

### 4.2 Ethereum / Base adapters

```ts
// api/chain/ethereum.adapter.js
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETHEREUM_RPC_URL),
});

export const ethereumAdapter = {
  name: 'ethereum',

  async waitForTransaction(txHash) {
    return client.waitForTransactionReceipt({ hash: txHash });
  },

  async getBlockNumber() {
    return client.getBlockNumber();
  },

  async getBalance(address, tokenAddress) {
    if (!tokenAddress) {
      return client.getBalance({ address });
    }
    // ERC-20 balanceOf
    return client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });
  },

  async estimateGasCost() {
    const gasPrice = await client.getGasPrice();
    return gasPrice * 21000n; // native transfer
  },
};
```

Repeat the same pattern for Base (import `base` from `viem/chains`, use `BASE_RPC_URL`).

### 4.3 Chain Factory

```ts
// api/chain/chain.factory.js
import { ethereumAdapter } from './ethereum.adapter.js';
import { baseAdapter } from './base.adapter.js';

const adapters = {
  ethereum: ethereumAdapter,
  base: baseAdapter,
};

export function getChainAdapter(network) {
  const adapter = adapters[network.toLowerCase()];
  if (!adapter) throw new Error(`Unsupported network: ${network}`);
  return adapter;
}
```

---

## 5. Fee Model & ZapPay Revenue

### 5.1 Current fee tiers (frontend `estimateFees.ts`)

| Amount (USD) | Base/L2 fee | Ethereum fee |
|---|---|---|
| $0.50 – $5 | $0.20 flat | $0.50 flat |
| $5 – $10 | $0.30 flat | $0.80 flat |
| $10 – $30 | $0.50 flat | $1.20 flat |
| $30 – $500 | 1% | 2% |
| $500+ | 0.5% | 1% |

### 5.2 How fees should work on-chain

There are **two types of fees** the payer pays:

| Fee type | Who receives it | How it's paid |
|---|---|---|
| **Gas fee** | Network validators | Deducted by the chain automatically from the payer's native token balance |
| **Platform fee** (ZapPay cut) | ZapPay's treasury wallet | Must be sent explicitly in a separate transfer or batched |

#### Option A — Two separate transfers (simplest)

The frontend sends **two transactions**:
1. `transfer(merchantAddress, amount)` — the merchant gets the exact amount.
2. `transfer(zappayAddress, platformFee)` — ZapPay gets the fee.

**Pros:** Simple, transparent, easy to audit.
**Cons:** Payer pays gas twice (significant on Ethereum mainnet, negligible on L2s like Base).

#### Option B — Single transfer to a splitter contract (recommended for mainnet)

Deploy a minimal **PaymentSplitter** smart contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZapPayRouter {
    address public immutable treasury;   // ZapPay's wallet

    event PaymentRouted(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        address token,
        uint256 merchantAmount,
        uint256 feeAmount
    );

    constructor(address _treasury) {
        treasury = _treasury;
    }

    /// @notice Pay a merchant. Fee is split automatically.
    function pay(
        bytes32 paymentId,
        address merchant,
        address token,        // address(0) for native ETH
        uint256 totalAmount,
        uint256 feeAmount
    ) external payable {
        uint256 merchantAmount = totalAmount - feeAmount;

        if (token == address(0)) {
            // Native ETH
            require(msg.value == totalAmount, "Wrong ETH amount");
            payable(merchant).transfer(merchantAmount);
            payable(treasury).transfer(feeAmount);
        } else {
            // ERC-20
            IERC20(token).transferFrom(msg.sender, merchant, merchantAmount);
            IERC20(token).transferFrom(msg.sender, treasury, feeAmount);
        }

        emit PaymentRouted(paymentId, msg.sender, merchant, token, merchantAmount, feeAmount);
    }
}
```

**Pros:** Single tx, single gas cost, on-chain event links to `paymentId` for easy indexing.
**Cons:** Requires deploying & maintaining a contract, payer must `approve()` the contract for ERC-20 tokens first (adds one extra tx on first use per token).

#### Recommendation

| Network | Strategy |
|---|---|
| **Base / L2s** | Option A (two transfers) — gas is < $0.01, simplicity wins |
| **Ethereum mainnet** | Option B (splitter contract) — saves $3-10 in gas |

### 5.3 Computing the fee in code

```ts
// Shared between frontend and backend
export function computePlatformFee(amountUsd: number, network: string): number {
  const isL1 = network.toLowerCase() === 'ethereum';
  if (amountUsd < 5)   return isL1 ? 0.50 : 0.20;
  if (amountUsd < 10)  return isL1 ? 0.80 : 0.30;
  if (amountUsd < 30)  return isL1 ? 1.20 : 0.50;
  if (amountUsd < 500) return amountUsd * (isL1 ? 0.02 : 0.01);
  return amountUsd * (isL1 ? 0.01 : 0.005);
}
```

The backend **must verify** the fee matches expectations before marking a payment as confirmed — never trust the frontend alone.

---

## 6. Frontend Wallet Integration

### 6.1 Libraries to install

```bash
npm install wagmi viem @tanstack/react-query @reown/appkit @reown/appkit-adapter-wagmi
```

> **Known issue (from memory):** `porto/internal` Module Not Found — install `porto` directly in the frontend app and add wagmi-related packages to `experimental.serverExternalPackages` in next.config.js if using Next.js.

### 6.2 wagmi config

```ts
// src/lib/wagmi.ts
import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),  // uses default public RPC
    [base.id]: http(),
  },
});
```

### 6.3 Sending payment (native ETH)

```ts
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

const { sendTransaction, data: txHash } = useSendTransaction();
const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

// Trigger payment
sendTransaction({
  to: merchantAddress,
  value: parseEther(amount),
});
```

### 6.4 Sending payment (ERC-20: USDC / USDT)

```ts
import { useWriteContract } from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';

const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',       // Ethereum mainnet
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',     // Base
};

const { writeContract } = useWriteContract();

// USDC has 6 decimals
writeContract({
  address: USDC_ADDRESS[chainId],
  abi: erc20Abi,
  functionName: 'transfer',
  args: [merchantAddress, parseUnits(amount, 6)],
});
```

### 6.5 Token addresses reference

| Token | Ethereum Mainnet | Base |
|---|---|---|
| **USDC** | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **USDT** | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` |
| **ETH** | native (no contract) | native (no contract) |

> USDC = 6 decimals, USDT = 6 decimals, ETH = 18 decimals.

---

## 7. Transaction Lifecycle & Status Machine

```
  CREATED ──────> PENDING ──────> CONFIRMED
     │               │
     │               └──> FAILED
     │
     └──> EXPIRED (TTL timeout)
```

| Status | Meaning | Trigger |
|---|---|---|
| `CREATED` | Payment link generated, waiting for payer | `POST /payments` |
| `PENDING` | Payer submitted tx, waiting for on-chain confirmation | Frontend sends `txHash` via `PATCH /payments/:id` |
| `CONFIRMED` | Tx mined and verified on-chain | Backend `waitForTransactionReceipt` succeeds |
| `FAILED` | Tx reverted or receipt shows failure | Backend detects `status: 'reverted'` in receipt |
| `EXPIRED` | Payer never paid within TTL (e.g. 30 min) | Cron job or TTL check |

### Backend status update logic

```ts
// When payer submits txHash
async function submitTransaction(paymentId, txHash, payerAddress) {
  // 1. Update DB
  await prisma.payment.update({
    where: { id: paymentId, status: 'CREATED' },
    data: { txHash, payer: payerAddress, status: 'PENDING' },
  });

  // 2. Start confirmation polling
  const adapter = getChainAdapter(payment.network);
  const receipt = await adapter.waitForTransaction(txHash);

  // 3. Verify receipt
  if (receipt.status === 'success') {
    // TODO: verify amount + recipient match the payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CONFIRMED' },
    });
  } else {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' },
    });
  }
}
```

---

## 8. Confirmation Polling / Event Listening

### Option A — `waitForTransactionReceipt` (simplest)

viem's built-in method polls the chain until the tx is mined:

```ts
const receipt = await client.waitForTransactionReceipt({
  hash: txHash,
  confirmations: 1,   // 1 for L2s, 2-3 for mainnet
  timeout: 120_000,    // 2 min timeout
});
```

Good for MVP. Blocks the process until confirmed.

### Option B — Queue-based (production)

For production, use a job queue (BullMQ + Redis) so the API doesn't block:

```
[API receives txHash] ──> enqueue "confirm-payment" job
                               │
                    [Worker picks up job]
                               │
                    [calls waitForTransactionReceipt]
                               │
                    [updates DB + emits SSE event]
```

### Option C — Webhook / indexer (advanced)

Use a service like **Alchemy Webhooks**, **QuickNode Streams**, or **The Graph** to get notified when a tx confirms. Most scalable but adds external dependency.

### Recommendation

Start with **Option A** for the MVP, move to **Option B** (BullMQ) when you need to handle multiple concurrent payments without blocking the API.

---

## 9. Security Considerations

### 9.1 Never trust the frontend

The backend **must independently verify** on-chain data:
- The tx actually exists and is mined
- The `to` address matches the merchant's `recipientAddress`
- The `value` (or ERC-20 `transfer` amount) matches the payment `amount`
- The token contract address is the expected one (not a fake token)
- The fee portion went to ZapPay's treasury (if using splitter contract)

### 9.2 Replay protection

- Store `txHash` in the DB with a **unique constraint** — a single tx can only be used for one payment.
- Check that the tx `from` matches the `payer` address submitted.

### 9.3 Race conditions

- Use DB-level locking or status checks (`WHERE status = 'CREATED'`) to prevent double-submission of a txHash for the same payment.
- Use optimistic locking or `updatedAt` checks if needed.

### 9.4 Private keys

**The backend should NEVER hold merchant or payer private keys.** All signing happens in the payer's browser wallet. The backend only needs a public RPC endpoint to read chain state.

If ZapPay needs to do on-chain actions (e.g., withdraw from splitter contract), use a separate admin service with a hardware wallet or KMS — never store keys in `.env`.

### 9.5 RPC reliability

- Use a paid RPC provider (Alchemy, Infura, QuickNode) — public RPCs have rate limits and can be unreliable.
- Consider a fallback RPC in case the primary is down.

---

## 10. Environment Variables Needed

```env
# === Blockchain RPCs ===
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# === ZapPay Treasury ===
ZAPPAY_TREASURY_ADDRESS=0x...   # wallet that receives platform fees

# === Splitter Contract (if using Option B for fees) ===
ZAPPAY_ROUTER_ADDRESS_ETHEREUM=0x...
ZAPPAY_ROUTER_ADDRESS_BASE=0x...

# === Payment Config ===
PAYMENT_TTL_MINUTES=30          # auto-expire unpaid payments
CONFIRMATION_COUNT_ETHEREUM=2   # block confirmations before CONFIRMED
CONFIRMATION_COUNT_BASE=1

# === Existing ===
DATABASE_URL=postgresql://...
PORT=4010
FRONTEND_URL=http://localhost:5173
```

---

## 11. Implementation Checklist

### Phase 1 — Core blockchain read (backend)

- [ ] Fill `chainAdapter.interface.ts` with the interface
- [ ] Implement `ethereum.adapter.js` using viem `createPublicClient`
- [ ] Implement `base.adapter.js`
- [ ] Implement `chain.factory.js`
- [ ] Add `PATCH /payments/:id` endpoint to receive `txHash` + `payer`
- [ ] Add tx verification logic (amount, recipient, token match)
- [ ] Add `txHash` unique constraint in Prisma schema
- [ ] Add payment expiry cron (`CREATED` → `EXPIRED` after TTL)

### Phase 2 — Frontend wallet (send real transactions)

- [ ] Install wagmi + viem + @tanstack/react-query
- [ ] Create wagmi config with Ethereum + Base chains
- [ ] Replace `window.ethereum.request` with wagmi `useConnect`
- [ ] Implement native ETH payment via `useSendTransaction`
- [ ] Implement ERC-20 payment via `useWriteContract` (USDC/USDT)
- [ ] Compute and display platform fee breakdown to payer
- [ ] Send `txHash` to API after wallet confirms
- [ ] Show real tx status (pending → confirmed) via polling or SSE

### Phase 3 — Fee collection

- [ ] For L2s: add second `transfer` call for ZapPay fee (Option A)
- [ ] For mainnet: deploy `ZapPayRouter` splitter contract (Option B)
- [ ] Backend verification that fee was paid correctly
- [ ] Unify fee computation between frontend and backend (shared function or API endpoint)

### Phase 4 — Production hardening

- [ ] BullMQ queue for async confirmation polling
- [ ] SSE endpoint for real-time payment status to payer
- [ ] Fallback RPC providers
- [ ] Rate limiting on payment creation
- [ ] Monitoring / alerting for failed confirmations
- [ ] Testnet deployment (Sepolia + Base Sepolia) for QA
