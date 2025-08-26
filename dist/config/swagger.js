"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiSpec = void 0;
exports.openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Sav3 API',
        version: '1.0.0',
        description: 'React Native compatible backend API for social discovery and communities',
        contact: {
            name: 'Sav3 Team',
            email: 'support@sav3.app',
        },
    },
    servers: [
        {
            url: '/api/v1',
            description: 'API v1',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    profile: { $ref: '#/components/schemas/Profile' },
                },
            },
            Profile: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    displayName: { type: 'string' },
                    bio: { type: 'string' },
                    birthdate: { type: 'string', format: 'date' },
                    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                    orientation: { type: 'string', enum: ['STRAIGHT', 'GAY', 'BISEXUAL', 'OTHER'] },
                    location: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    isVisible: { type: 'boolean' },
                    isVerified: { type: 'boolean' },
                },
            },
            Community: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    visibility: { type: 'string', enum: ['PUBLIC', 'PRIVATE', 'SECRET'] },
                    memberCount: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            Location: {
                type: 'object',
                properties: {
                    latitude: { type: 'number', minimum: -90, maximum: 90 },
                    longitude: { type: 'number', minimum: -180, maximum: 180 },
                },
                required: ['latitude', 'longitude'],
            },
            GeospatialQuery: {
                type: 'object',
                properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    radius: { type: 'number', minimum: 1, maximum: 100 },
                    unit: { type: 'string', enum: ['km', 'miles'], default: 'km' },
                },
                required: ['latitude', 'longitude'],
            },
        },
    },
    paths: {
        '/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 },
                                    displayName: { type: 'string' },
                                    birthdate: { type: 'string', format: 'date' },
                                    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                                    orientation: { type: 'string', enum: ['STRAIGHT', 'GAY', 'BISEXUAL', 'OTHER'] },
                                },
                                required: ['email', 'password', 'displayName', 'birthdate', 'gender', 'orientation'],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        user: { $ref: '#/components/schemas/User' },
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: '#/components/responses/BadRequest' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Login user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' },
                                    deviceToken: { type: 'string' },
                                    platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                                },
                                required: ['email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        user: { $ref: '#/components/schemas/User' },
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: 'Invalid credentials' },
                },
            },
        },
        '/auth/refresh': {
            post: {
                tags: ['Authentication'],
                summary: 'Refresh access token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    refreshToken: { type: 'string' },
                                },
                                required: ['refreshToken'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Token refreshed',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/geospatial/nearby': {
            get: {
                tags: ['Geospatial'],
                summary: 'Find nearby users/communities',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'latitude',
                        in: 'query',
                        required: true,
                        schema: { type: 'number' },
                    },
                    {
                        name: 'longitude',
                        in: 'query',
                        required: true,
                        schema: { type: 'number' },
                    },
                    {
                        name: 'radius',
                        in: 'query',
                        schema: { type: 'number', default: 10 },
                    },
                    {
                        name: 'type',
                        in: 'query',
                        schema: { type: 'string', enum: ['users', 'communities', 'all'], default: 'all' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Nearby results',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                                        communities: { type: 'array', items: { $ref: '#/components/schemas/Community' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/media/upload': {
            post: {
                tags: ['Media'],
                summary: 'Upload media file',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    type: { type: 'string', enum: ['profile', 'community', 'message'] },
                                },
                                required: ['file'],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'File uploaded successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        url: { type: 'string' },
                                        type: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/notifications/register-device': {
            post: {
                tags: ['Push Notifications'],
                summary: 'Register device for push notifications',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    fcmToken: { type: 'string' },
                                    platform: { type: 'string', enum: ['ios', 'android', 'web'] },
                                    deviceId: { type: 'string' },
                                },
                                required: ['fcmToken', 'platform', 'deviceId'],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Device registered' },
                },
            },
        },
        '/analytics/event': {
            post: {
                tags: ['Analytics'],
                summary: 'Track user event',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    event: { type: 'string' },
                                    properties: { type: 'object' },
                                    platform: { type: 'string' },
                                    appVersion: { type: 'string' },
                                },
                                required: ['event'],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Event tracked' },
                },
            },
        },
        '/config/features': {
            get: {
                tags: ['Configuration'],
                summary: 'Get feature flags and remote config',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Feature configuration',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        features: {
                                            type: 'object',
                                            properties: {
                                                pushNotifications: { type: 'boolean' },
                                                geospatial: { type: 'boolean' },
                                                videoUploads: { type: 'boolean' },
                                                premiumFeatures: { type: 'boolean' },
                                            },
                                        },
                                        config: {
                                            type: 'object',
                                            properties: {
                                                maxFileSize: { type: 'number' },
                                                allowedFileTypes: { type: 'array', items: { type: 'string' } },
                                                nearbyRadius: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    responses: {
        BadRequest: {
            description: 'Bad request',
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
            description: 'Not found',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Error' },
                },
            },
        },
        InternalServerError: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Error' },
                },
            },
        },
    },
};
//# sourceMappingURL=swagger.js.map