export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            email: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
        schemas: {
            Error: {
                type: string;
                properties: {
                    error: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    details: {
                        type: string;
                    };
                };
            };
            User: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    email: {
                        type: string;
                    };
                    isActive: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    profile: {
                        $ref: string;
                    };
                };
            };
            Profile: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                    };
                    bio: {
                        type: string;
                    };
                    birthdate: {
                        type: string;
                        format: string;
                    };
                    gender: {
                        type: string;
                        enum: string[];
                    };
                    orientation: {
                        type: string;
                        enum: string[];
                    };
                    location: {
                        type: string;
                    };
                    latitude: {
                        type: string;
                    };
                    longitude: {
                        type: string;
                    };
                    isVisible: {
                        type: string;
                    };
                    isVerified: {
                        type: string;
                    };
                };
            };
            Community: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    visibility: {
                        type: string;
                        enum: string[];
                    };
                    memberCount: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                };
            };
            Location: {
                type: string;
                properties: {
                    latitude: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    longitude: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                };
                required: string[];
            };
            GeospatialQuery: {
                type: string;
                properties: {
                    latitude: {
                        type: string;
                    };
                    longitude: {
                        type: string;
                    };
                    radius: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    unit: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                };
                required: string[];
            };
        };
    };
    paths: {
        '/auth/register': {
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    email: {
                                        type: string;
                                        format: string;
                                    };
                                    password: {
                                        type: string;
                                        minLength: number;
                                    };
                                    displayName: {
                                        type: string;
                                    };
                                    birthdate: {
                                        type: string;
                                        format: string;
                                    };
                                    gender: {
                                        type: string;
                                        enum: string[];
                                    };
                                    orientation: {
                                        type: string;
                                        enum: string[];
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        user: {
                                            $ref: string;
                                        };
                                        accessToken: {
                                            type: string;
                                        };
                                        refreshToken: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    400: {
                        $ref: string;
                    };
                };
            };
        };
        '/auth/login': {
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    email: {
                                        type: string;
                                        format: string;
                                    };
                                    password: {
                                        type: string;
                                    };
                                    deviceToken: {
                                        type: string;
                                    };
                                    platform: {
                                        type: string;
                                        enum: string[];
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        user: {
                                            $ref: string;
                                        };
                                        accessToken: {
                                            type: string;
                                        };
                                        refreshToken: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/auth/refresh': {
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    refreshToken: {
                                        type: string;
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        accessToken: {
                                            type: string;
                                        };
                                        refreshToken: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/geospatial/nearby': {
            get: {
                tags: string[];
                summary: string;
                security: {
                    bearerAuth: never[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        default?: undefined;
                        enum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        default: number;
                        enum?: undefined;
                    };
                    required?: undefined;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                    required?: undefined;
                })[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        users: {
                                            type: string;
                                            items: {
                                                $ref: string;
                                            };
                                        };
                                        communities: {
                                            type: string;
                                            items: {
                                                $ref: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/media/upload': {
            post: {
                tags: string[];
                summary: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: string;
                                properties: {
                                    file: {
                                        type: string;
                                        format: string;
                                    };
                                    type: {
                                        type: string;
                                        enum: string[];
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        id: {
                                            type: string;
                                        };
                                        url: {
                                            type: string;
                                        };
                                        type: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/notifications/register-device': {
            post: {
                tags: string[];
                summary: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    fcmToken: {
                                        type: string;
                                    };
                                    platform: {
                                        type: string;
                                        enum: string[];
                                    };
                                    deviceId: {
                                        type: string;
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/analytics/event': {
            post: {
                tags: string[];
                summary: string;
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                properties: {
                                    event: {
                                        type: string;
                                    };
                                    properties: {
                                        type: string;
                                    };
                                    platform: {
                                        type: string;
                                    };
                                    appVersion: {
                                        type: string;
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/config/features': {
            get: {
                tags: string[];
                summary: string;
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        features: {
                                            type: string;
                                            properties: {
                                                pushNotifications: {
                                                    type: string;
                                                };
                                                geospatial: {
                                                    type: string;
                                                };
                                                videoUploads: {
                                                    type: string;
                                                };
                                                premiumFeatures: {
                                                    type: string;
                                                };
                                            };
                                        };
                                        config: {
                                            type: string;
                                            properties: {
                                                maxFileSize: {
                                                    type: string;
                                                };
                                                allowedFileTypes: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                };
                                                nearbyRadius: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    responses: {
        BadRequest: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
        Unauthorized: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
        NotFound: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
        InternalServerError: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=swagger.d.ts.map