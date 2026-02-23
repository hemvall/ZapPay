# Crypto Payment API v0.1 - Endpoints

---

## 🟢 Merchant Endpoints

### 1️⃣ POST /payments — Create a new payment

**Purpose:**
- Merchant wants to request a crypto payment
- Generates a link + QR code
- Estimates fees

**Payload (body JSON):
```json
{
  "amount": "50.00",
  "token": "USDC",
  "network": "ethereum",
  "recipientAddress": "0x123..."
}
```

**Response:**
```json
{
  "paymentId": "uuid-v4",
  "paymentUrl": "https://yourfrontend.com/pay/uuid-v4",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=https://yourfrontend.com/pay/uuid-v4&size=200x200",
  "estimatedFees": "0.23"
}
```

**What it does:**
- Creates a payment in DB (status = pending)
- Chooses chain adapter
- Estimates fees
- Generates payment address & deep link / QR

---

### 2️⃣ GET /payments — List payments (dashboard)

**Purpose:**
- Merchant wants to see all their payments

**Query parameters (optional):**
```
?status=pending|confirmed|expired
?dateFrom=2026-02-01
?dateTo=2026-02-23
```

**Response:**
```json
[
  {
    "paymentId": "uuid-v4",
    "amount": "50.00",
    "token": "USDC",
    "network": "ethereum",
    "recipientAddress": "0x123...",
    "status": "pending",
    "createdAt": "2026-02-23T10:00:00Z"
  },
  {
    "paymentId": "uuid-v4",
    "amount": "10.00",
    "token": "ETH",
    "network": "base",
    "recipientAddress": "0x456...",
    "status": "confirmed",
    "createdAt": "2026-02-22T15:30:00Z"
  }
]
```

**What it does:**
- Returns all payments for the merchant
- Filters by status / date if provided

---

### 3️⃣ GET /payments/{id} — Payment details

**Purpose:**
- Merchant wants details of a specific payment

**Path parameter:**
```
id = paymentId
```

**Response:**
```json
{
  "paymentId": "uuid-v4",
  "amount": "50.00",
  "token": "USDC",
  "network": "ethereum",
  "recipientAddress": "0x123...",
  "paymentAddress": "0xabc...",
  "paymentUrl": "https://yourfrontend.com/pay/uuid-v4",
  "qrCode": "...",
  "estimatedFees": "0.23",
  "status": "pending",
  "txHash": null,
  "explorerUrl": null,
  "createdAt": "2026-02-23T10:00:00Z",
  "paidAt": null
}
```

**What it does:**
- Returns full info about one payment
- Tracks blockchain status

---

## 🟢 Payer Endpoint

### 4️⃣ GET /pay/{id} — Retrieve payment for payer

**Purpose:**
- Payer opens the link / QR code
- Gets summary + deep link + fees

**Path parameter:**
```
id = paymentId
```

**Response:**
```json
{
  "paymentId": "uuid-v4",
  "amount": "50.00",
  "token": "USDC",
  "network": "ethereum",
  "recipientAddress": "0x123...",
  "paymentUrl": "https://yourfrontend.com/pay/uuid-v4",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=https://yourfrontend.com/pay/uuid-v4&size=200x200",
  "estimatedFees": "0.23",
  "status": "pending"
}
```

**What it does:**
- Shows payer exactly what they pay
- Lets frontend detect wallet / deep link
- Shows clear fees
- No ability to set flags — all state comes from backend

---

## 🟢 Infra / Health

### 5️⃣ GET /health — Service health check

**Purpose:**
- Check that API + DB is alive

**Response:**
```json
{
  "status": "ok",
  "uptime": 123456,
  "db": "connected"
}
```

**What it does:**
- Simple endpoint for monitoring / load balancers

---

## ⚡ Summary Table

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| /payments | POST | Create payment | amount, token, network, recipient | paymentId, paymentUrl, QR, estimatedFees |
| /payments | GET | List payments | optional filters | array of payment objects |
| /payments/{id} | GET | Payment details | paymentId | payment object with status & tx info |
| /pay/{id} | GET | Payer view | paymentId | summary for payer (amount, fees, QR, deep link) |
| /health | GET | Health check | none | status, uptime, db |

