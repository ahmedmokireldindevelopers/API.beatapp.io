import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BeatApp Integrations API',
      version: '1.1.0',
      description: 'OAuth callbacks and integrations for GoHighLevel and Wafeq',
      contact: {
        name: 'BeatApp Support',
        url: 'https://beatapp.io',
      },
    },
    servers: [
      {
        url: 'https://api.beatapp.io',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'INVALID_STATE',
                  enum: [
                    'INVALID_STATE',
                    'INVALID_AUTH_CODE',
                    'TOKEN_EXCHANGE_FAILED',
                    'MISSING_REQUIRED_FIELD',
                    'INVALID_LOCATION_ID',
                    'INVALID_API_KEY',
                    'DATABASE_ERROR',
                    'RECORD_NOT_FOUND',
                    'DUPLICATE_RECORD',
                    'EXTERNAL_SERVICE_ERROR',
                    'WAFEQ_CONNECTION_FAILED',
                    'GHL_CONNECTION_FAILED',
                    'INTERNAL_SERVER_ERROR',
                    'NOT_FOUND',
                    'UNAUTHORIZED',
                    'FORBIDDEN',
                    'BAD_REQUEST',
                  ],
                },
                message: {
                  type: 'string',
                  example: 'Invalid OAuth state parameter',
                },
                statusCode: {
                  type: 'integer',
                  example: 400,
                },
                details: {
                  type: 'object',
                  nullable: true,
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
              required: ['code', 'message', 'statusCode', 'timestamp'],
            },
          },
          required: ['success', 'error'],
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                uptime: {
                  type: 'number',
                  description: 'Server uptime in seconds',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['success', 'data', 'timestamp'],
        },
        WafeqLinkRequest: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'GHL Location ID',
              example: 'loc_123456',
            },
            apiKey: {
              type: 'string',
              description: 'Wafeq API Key',
              example: 'wfq_key_1234567890',
            },
          },
          required: ['locationId', 'apiKey'],
        },
        WafeqLinkResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                integration_id: {
                  type: 'string',
                  description: 'Unique integration record ID',
                },
                location_id: {
                  type: 'string',
                },
                platform: {
                  type: 'string',
                  example: 'wafeq',
                },
                auth_type: {
                  type: 'string',
                  example: 'api_key',
                },
                status: {
                  type: 'string',
                  example: 'active',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['success', 'data', 'timestamp'],
        },
        OAuthCallbackResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Token exchanged and stored successfully',
                },
                integration_id: {
                  type: 'string',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['success', 'data', 'timestamp'],
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    paths: {},
  },
  apis: ['./src/app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);