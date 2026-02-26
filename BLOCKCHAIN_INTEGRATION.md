 Implementation Summary
                                                                                                                          Phase 1 — Backend Chain Layer

  ┌────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────┐
  │                  File                  │                                 Change                                  │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/chainAdapter.interface.ts    │ Full ChainAdapter + TransactionReceipt interfaces                       │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/Adapters/ethereum.adapter.js │ viem createPublicClient for Ethereum mainnet with waitForTransaction,   │
  │                                        │ getBalance, estimateGasCost                                             │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/Adapters/base.adapter.js     │ Same pattern for Base L2                                                │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/chain.factory.js             │ getChainAdapter(network) factory to select adapter by name              │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/fees.js                      │ computePlatformFee(amountUsd, network) — shared fee logic matching      │
  │                                        │ frontend tiers                                                          │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/chain/PaymentSplitter.js           │ ZapPayRouter ABI + contract addresses for future deployment             │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/prisma/schema.prisma               │ Added @unique constraint on txHash (replay protection)                  │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/services/payment.service.js        │ Added submitTransaction() (PATCH handler:                               │
  │                                        │ CREATED→PENDING→CONFIRMED/FAILED) + expireStalePayments() cron          │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/controllers/payment.controller.js  │ Added submitTransaction controller                                      │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/routes/merchant.js                 │ Added PATCH /:id route                                                  │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/index.js                           │ Added 5-min interval for auto-expiring stale payments                   │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/.env.example                       │ Added blockchain RPC URLs, treasury address, confirmation counts        │
  ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ api/package.json                       │ Installed viem                                                          │
  └────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────┘

  Phase 2 — Frontend Wallet Integration

  ┌───────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┐
  │           File            │                                        Change                                        │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ package.json              │ Installed wagmi, viem, @tanstack/react-query                                         │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ src/lib/wagmi.ts          │ wagmi config with Ethereum + Base chains                                             │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ src/lib/tokens.ts         │ Token addresses (USDC/USDT per chain), decimals, chain IDs, treasury                 │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ src/lib/WagmiProvider.tsx │ WagmiProvider + QueryClientProvider wrapper                                          │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ src/App.tsx               │ Wrapped with <WagmiProvider>                                                         │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │                           │ Complete rewrite: real useSendTransaction (ETH) / useWriteContract (ERC-20), wallet  │
  │ src/pages/PayFlow.tsx     │ connect, chain switching, useWaitForTransactionReceipt, PATCH txHash to API, block   │
  │                           │ explorer links                                                                       │
  ├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
  │ src/pages/Home.tsx        │ Replaced window.ethereum.request with wagmi useConnect/useAccount/useDisconnect      │
  └───────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘

  Key Behaviors

  - Payer flow: Connect wallet → auto chain switch → send real tx → wait for confirmation → PATCH txHash to API → show
  explorer link
  - Backend verification: waitForTransactionReceipt on-chain → update status to CONFIRMED/FAILED
  - Fee model: Unified tiered fee schedule (frontend + backend match)
  - Security: txHash unique constraint prevents replay attacks; status guards prevent double-submission
  - Auto-expiry: CREATED payments expire after 30 min (configurable via PAYMENT_TTL_MINUTES)