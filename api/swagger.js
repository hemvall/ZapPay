module.exports = {
    openapi: '3.0.0',
    info: {
        title: 'Zappay API',
        version: '0.2.0',
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
                                schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }
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
                description: 'Returns all payments ordered by creation date (newest first).',
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
                                    label: { type: 'string', example: 'Invoice #42', description: 'Optional label / description' },
                                    merchantName: { type: 'string', example: 'My Shop', description: 'Optional merchant display name' }
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
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/payments/address/{address}': {
            get: {
                summary: 'Get payments by wallet address',
                tags: ['Merchant'],
                description: 'Returns all payments where the given address is either the recipient or the payer.',
                parameters: [
                    { name: 'address', in: 'path', required: true, schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }, description: 'Ethereum wallet address' },
                    { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['CREATED', 'PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'] }, description: 'Filter by payment status' }
                ],
                responses: {
                    '200': {
                        description: 'Array of payment objects for this address',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Payment' }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid address format',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/payments/address/{address}/stream': {
            get: {
                summary: 'Stream payment status updates (SSE)',
                tags: ['Merchant'],
                description: 'Opens a Server-Sent Events stream. The server pushes `payment.status` events whenever a payment involving the given address changes status.',
                parameters: [
                    { name: 'address', in: 'path', required: true, schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }, description: 'Ethereum wallet address' }
                ],
                responses: {
                    '200': {
                        description: 'SSE stream — each event is `event: payment.status` with a JSON Payment object in the `data` field',
                        content: {
                            'text/event-stream': {
                                schema: { type: 'string', example: 'event: payment.status\ndata: {"id":"...","status":"CONFIRMED",...}\n\n' }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid address format',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
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
                    '404': {
                        description: 'Payment not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            },
            patch: {
                summary: 'Update a payment',
                tags: ['Merchant'],
                description: 'Partially update a payment (status, txHash, payer). Emits a `payment.updated` event on success.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['CREATED', 'PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'], description: 'New payment status' },
                                    txHash: { type: 'string', description: 'Transaction hash' },
                                    payer: { type: 'string', description: 'Payer wallet address' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Updated payment object',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Payment' }
                            }
                        }
                    },
                    '400': {
                        description: 'No valid fields provided',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    '404': {
                        description: 'Payment not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/payments/{id}/submit': {
            patch: {
                summary: 'Submit a transaction for a payment',
                tags: ['Payer'],
                description: 'Payer submits a txHash after sending the on-chain transaction. Sets status to PENDING, then waits for on-chain confirmation and updates to CONFIRMED or FAILED.',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    txHash: { type: 'string', description: 'On-chain transaction hash' },
                                    payer: { type: 'string', description: 'Payer wallet address' }
                                },
                                required: ['txHash', 'payer']
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Confirmation result',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['CONFIRMED', 'FAILED', 'PENDING'] },
                                        txHash: { type: 'string' },
                                        error: { type: 'string', nullable: true }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Missing required fields',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    '404': {
                        description: 'Payment not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    '409': {
                        description: 'Payment is not in CREATED state',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/pay/payments/{id}': {
            get: {
                summary: 'Get payment details for payer',
                tags: ['Payer'],
                description: 'Returns payment details needed for the payer-facing payment page (recap + deep link).',
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
                    '404': {
                        description: 'Payment not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
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
                    merchantName: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['CREATED', 'PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'] },
                    txHash: { type: 'string', nullable: true },
                    payer: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    }
};
