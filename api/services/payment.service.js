const store = {
    "1": {
        id: "1",
        amount: "50.00",
        currency: "USDC",
        description: "Test payment #1",
        status: "created",
        createdAt: "2026-02-23T10:00:00.000Z",
        paymentAddress: "0xAbC123...ETH",
        estimatedFees: "0.23",
    },
    "2": {
        id: "2",
        amount: "120.50",
        currency: "ETH",
        description: "Test payment #2",
        status: "pending",
        createdAt: "2026-02-23T11:00:00.000Z",
        paymentAddress: "0xDeF456...ETH",
        estimatedFees: "0.50",
    },
    "3": {
        id: "3",
        amount: "75.00",
        currency: "USDT",
        description: "Test payment #3",
        status: "confirmed",
        createdAt: "2026-02-23T09:30:00.000Z",
        paymentAddress: "0xGhI789...ETH",
        estimatedFees: "0.30",
    }
};
let nextId = 1;

function createPayment({ amount, currency = 'USD', description = '' }) {
    const id = String(nextId++);
    const payment = {
        id,
        amount,
        currency,
        description,
        status: 'created',
        createdAt: new Date().toISOString(),
    };
    store[id] = payment;
    return payment;
}

function getPayment(id) {
    return store[id] || null;
}

function getPaymentForPayer(id) {
    return store[id] || null;
}

function listPayments() {
    return store ? Object.values(store) : [];
}

function updatePayment(id, patch) {
    if (!store[id]) return null;
    store[id] = { ...store[id], ...patch };
    return store[id];
}

module.exports = {
    createPayment,
    getPayment,
    getPaymentForPayer,
    listPayments,
    updatePayment,
};
