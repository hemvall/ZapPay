# ZapPay

A modern cryptocurrency payment application built with React and TypeScript.

## Features

- **Multi-Crypto Support**: Accept payments in USDC, USDT, and ETH
- **Multiple Networks**: Support for Base and Ethereum mainnet
- **QR Code Generation**: Easy payment request sharing via QR codes
- **Fast & Lightweight**: Built with Vite for optimal performance
- **Type-Safe**: Full TypeScript support for reliable development

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **UI Icons**: Lucide React
- **QR Codes**: qrcode.react
- **Linting**: ESLint

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build
```

### Lint

```bash
# Check code quality
npm run lint
```

### Preview

```bash
# Preview production build locally
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page components (Home, PayFlow)
├── data/           # Mock data and utilities
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
└── main.tsx        # Application entry point
```

## Routes

- `/` - Home page with payment options
- `/pay/:id` - Payment flow for specific transaction

## Flow

```mermaid
flowchart TB
    subgraph src
        direction TB

        %% Entry points
        server["server.ts"]
        app["app.ts"]

        %% Config
        config["config/\n- env.ts"]

        %% Routes
        subgraph routes
            merchantRoutes["routes/Merchant.js\n- POST /payments\n- GET /payments\n- GET /payments/:id"]
            payerRoutes["routes/Payer.js\n- GET /pay/:id"]
            webhookRoutes["routes/Webhook.js\n- POST /webhooks/payments"]
            healthRoutes["routes/Health.js\n- GET /health"]
        end

        %% Controllers
        subgraph controllers
            paymentController["controllers/payment.controller.ts"]
        end

        %% Services
        subgraph services
            paymentService["services/payment.service.ts"]
            feeService["services/fee.service.ts"]
            walletService["services/wallet.service.ts"]
            notificationService["services/notification.service.ts"]
        end

        %% Chain Layer
        subgraph chain
            chainInterface["chain/chainAdapter.interface.ts"]
            chainFactory["chain/chain.factory.ts"]
            subgraph adapters
                ethereumAdapter["chain/adapters/ethereum.adapter.ts"]
                baseAdapter["chain/adapters/base.adapter.ts"]
            end
        end

        %% Repositories & DB
        subgraph repositories
            paymentRepository["repositories/payment.repository.ts"]
        end
        db["db/prisma.ts"]

        %% Middlewares & Utils
        middlewares["middlewares/\n- error.middleware.ts\n- validate.middleware.ts"]
        utils["utils/logger.ts"]

        %% Connections
        server --> app
        app --> merchantRoutes
        app --> payerRoutes
        app --> webhookRoutes
        app --> healthRoutes

        merchantRoutes --> paymentController
        payerRoutes --> paymentController
        webhookRoutes --> paymentController

        paymentController --> paymentService
        paymentService --> feeService
        paymentService --> walletService
        paymentService --> notificationService
        paymentService --> chainFactory
        paymentService --> paymentRepository

        chainFactory --> chainInterface
        chainFactory --> ethereumAdapter
        chainFactory --> baseAdapter

        paymentRepository --> db
    end
```


## License

MIT