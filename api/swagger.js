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
                responses: { '200': { description: 'Received' } }
            }
        },
        '/payments/create': {
            post: {
                summary: 'Create payment',
                tags: ['Merchant'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    amount: { type: 'number' },
                                    currency: { type: 'string' },
                                    description: { type: 'string' }
                                },
                                required: ['amount']
                            }
                        }
                    }
                },
                responses: {
                    '201': { description: 'Payment created' }
                }
            }
        },
        '/payments/{id}': {
            get: {
                summary: 'Get payment',
                tags: ['Merchant'],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: { '200': { description: 'Payment object' }, '404': { description: 'Not found' } }
            }
        }
    }
};
