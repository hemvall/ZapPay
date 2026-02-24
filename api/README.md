# Zappay API (local)

Minimal Express API for local development.

Quick start:

```bash
cd api
npm install
npm start
```

Endpoints:

- `GET /health` — health check
- `POST /payments/create` — create a payment (JSON body: `amount`, `currency`, `description`)
- `GET /payments/:id` — get payment by id
- `POST /payments/webhook` — webhook receiver (logs posted body)

Notes:
- This is a minimal, in-memory demo server. For production you should add persistent storage, authentication, and webhook verification.
