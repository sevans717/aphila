"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const batch_service_1 = require("../services/batch.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Schemas
const batchOperationSchema = zod_1.z.object({
    operations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        operation: zod_1.z.enum(['create', 'update', 'delete']),
        resource: zod_1.z.enum(['message', 'community', 'user', 'friendship']),
        data: zod_1.z.any().optional(),
        params: zod_1.z.any().optional(),
    })),
});
const syncSchema = zod_1.z.object({
    lastSync: zod_1.z.string().datetime(),
});
const bulkFetchSchema = zod_1.z.object({
    requests: zod_1.z.array(zod_1.z.object({
        resource: zod_1.z.enum(['users', 'communities', 'messages']),
        ids: zod_1.z.array(zod_1.z.string()),
    })),
});
/**
 * POST /batch/operations - Execute multiple operations in a transaction
 */
router.post('/operations', auth_1.requireAuth, (0, validate_1.validateRequest)({
    body: batchOperationSchema,
    maxBodySize: 1024 * 1024, // 1MB limit for batch operations
}), async (req, res) => {
    try {
        const { operations } = req.body;
        // Limit batch size for performance
        if (operations.length > 50) {
            return response_1.ResponseHelper.error(res, 'BATCH_TOO_LARGE', 'Maximum 50 operations per batch', 400, { maxOperations: 50, received: operations.length }, false);
        }
        const results = await batch_service_1.BatchService.executeBatch(operations);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        logger_1.logger.info('Batch operation completed:', {
            userId: req.user.id,
            operationCount: operations.length,
            successCount,
            errorCount,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            results,
            summary: {
                total: operations.length,
                successful: successCount,
                failed: errorCount,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Batch operation failed:', error);
        return response_1.ResponseHelper.serverError(res, 'Batch operation failed');
    }
});
/**
 * POST /batch/sync - Get data changes since last sync
 */
router.post('/sync', auth_1.requireAuth, (0, validate_1.validateRequest)({
    body: syncSchema,
}), async (req, res) => {
    try {
        const { lastSync } = req.body;
        const userId = req.user.id;
        const syncData = await batch_service_1.BatchService.getSyncData(userId, lastSync);
        logger_1.logger.info('Sync data retrieved:', {
            userId,
            lastSync,
            newLastSync: syncData.lastSync,
            updateCounts: {
                communities: syncData.updates.communities.length,
                messages: syncData.updates.messages.length,
                users: syncData.updates.users.length,
                friendships: syncData.updates.friendships.length,
            },
            requestId: res.locals.requestId,
        });
        // Add cache headers for sync data
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
        return response_1.ResponseHelper.success(res, syncData);
    }
    catch (error) {
        logger_1.logger.error('Sync data fetch failed:', error);
        return response_1.ResponseHelper.serverError(res, 'Failed to fetch sync data');
    }
});
/**
 * POST /batch/fetch - Bulk fetch multiple resources
 */
router.post('/fetch', auth_1.requireAuth, (0, validate_1.validateRequest)({
    body: bulkFetchSchema,
}), async (req, res) => {
    try {
        const { requests } = req.body;
        // Limit bulk fetch size
        const totalIds = requests.reduce((sum, req) => sum + req.ids.length, 0);
        if (totalIds > 200) {
            return response_1.ResponseHelper.error(res, 'BULK_FETCH_TOO_LARGE', 'Maximum 200 total IDs per bulk fetch', 400, { maxIds: 200, received: totalIds }, false);
        }
        const results = await batch_service_1.BatchService.bulkFetch(requests);
        logger_1.logger.info('Bulk fetch completed:', {
            userId: req.user.id,
            requestCount: requests.length,
            totalIds,
            requestId: res.locals.requestId,
        });
        // Add cache headers for bulk fetch
        res.set({
            'Cache-Control': 'public, max-age=300', // 5 minutes cache
            'ETag': `"bulk-${Date.now()}"`,
        });
        return response_1.ResponseHelper.success(res, results);
    }
    catch (error) {
        logger_1.logger.error('Bulk fetch failed:', error);
        return response_1.ResponseHelper.serverError(res, 'Bulk fetch failed');
    }
});
/**
 * GET /batch/health - Batch service health check
 */
router.get('/health', async (req, res) => {
    try {
        // Simple health check - try to query the database
        await batch_service_1.BatchService.bulkFetch([{ resource: 'users', ids: [] }]);
        return response_1.ResponseHelper.success(res, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            capabilities: [
                'batch_operations',
                'data_sync',
                'bulk_fetch',
            ],
        });
    }
    catch (error) {
        logger_1.logger.error('Batch service health check failed:', error);
        return response_1.ResponseHelper.serverError(res, 'Batch service unhealthy');
    }
});
exports.default = router;
//# sourceMappingURL=batch.routes.js.map