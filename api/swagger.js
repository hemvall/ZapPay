module.exports = {
    openapi: '3.0.0',
    info: {
        title: 'Zappay API',
        version: '0.1.0',
        description: 'Minimal local API for Zappay demo',
    },
    servers: [
        { url: 'http://localhost:4010', description: 'Local server' }
    ],
    tags: [
        { name: 'Infra', description: 'Internal / health endpoints' },
        { name: 'Merchant', description: 'Endpoints for merchants' },
        { name: 'Payer', description: 'Endpoints for payers' },
    ],
    paths: {
        '/health': {
            get: {
                summary: 'Health check',
                tags: ['Infra'],
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { status: { type: 'string' } } }
                            }
                        }
                    }
                }
            }
        },
        '/payments': {
            get: {
                summary: 'List payments',
                tags: ['Merchant'],
                responses: {
                    '200': {
                        description: 'Array of payment objects',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Payment' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Create a payment link',
                tags: ['Merchant'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    amount: { type: 'string', example: '50.00', description: 'Payment amount' },
                                    token: { type: 'string', example: 'USDC', description: 'Token symbol (USDC, USDT, ETH)' },
                                    network: { type: 'string', example: 'base', description: 'Blockchain network (base, ethereum, polygon, arbitrum, optimism)' },
                                    recipientAddress: { type: 'string', example: '0x1234...abcd', description: 'Wallet address to receive the payment' },
                                    label: { type: 'string', example: 'Invoice #42', description: 'Optional label / description' }
                                },
                                required: ['amount', 'token', 'network', 'recipientAddress']
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Payment created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        paymentId: { type: 'string', format: 'uuid', description: 'Unique payment ID' },
                                        paymentUrl: { type: 'string', format: 'uri', description: 'Shareable payment link' },
                                        qrCode: { type: 'string', format: 'uri', description: 'QR code image URL' },
                                        estimatedFees: { type: 'string', description: 'Estimated network fee in USD' }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Missing required fields',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/payments/{id}': {
            get: {
                summary: 'Get payment by ID',
                tags: ['Merchant'],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: {
                    '200': {
                        description: 'Payment object',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Payment' }
                            }
                        }
                    },
                    '404': { description: 'Not found' }
                }
            }
        },
        '/pay/{id}': {
            get: {
                summary: 'Get payment details for payer',
                tags: ['Payer'],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: {
                    '200': {
                        description: 'Payment object',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Payment' }
                            }
                        }
                    },
                    '404': { description: 'Not found' }
                }
            }
        }
    },
    components: {
        schemas: {
            Payment: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    amount: { type: 'string', description: 'Decimal amount' },
                    token: { type: 'string' },
                    network: { type: 'string' },
                    recipientAddress: { type: 'string' },
                    label: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['CREATED', 'PENDING', 'CONFIRMED', 'FAILED'] },
                    txHash: { type: 'string', nullable: true },
                    payer: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            }
        }
    }
};
