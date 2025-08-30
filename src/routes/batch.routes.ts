import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { BatchService } from "../services/batch.service";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";

const router = Router();

// Schemas
const batchOperationSchema = z.object({
  operations: z.array(
    z.object({
      id: z.string(),
      operation: z.enum(["create", "update", "delete"]),
      resource: z.enum(["message", "community", "user", "friendship"]),
      data: z.any().optional(),
      params: z.any().optional(),
    })
  ),
});

const syncSchema = z.object({
  lastSync: z.string().datetime(),
});

const bulkFetchSchema = z.object({
  requests: z.array(
    z.object({
      resource: z.enum(["users", "communities", "messages"]),
      ids: z.array(z.string()),
    })
  ),
});

/**
 * POST /batch/operations - Execute multiple operations in a transaction
 */
router.post(
  "/operations",
  requireAuth,
  validateRequest({
    body: batchOperationSchema,
    maxBodySize: 1024 * 1024, // 1MB limit for batch operations
  }),
  async (req, res) => {
    try {
      const { operations } = req.body;

      // Limit batch size for performance
      if (operations.length > 50) {
        return ResponseHelper.error(
          res,
          "BATCH_TOO_LARGE",
          "Maximum 50 operations per batch",
          400,
          { maxOperations: 50, received: operations.length },
          false
        );
      }

      const results = await BatchService.executeBatch(operations);

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      logger.info("Batch operation completed:", {
        userId: req.user!.id,
        operationCount: operations.length,
        successCount,
        errorCount,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        results,
        summary: {
          total: operations.length,
          successful: successCount,
          failed: errorCount,
        },
      });
    } catch (error: any) {
      logger.error("Batch operation failed:", error);
      return ResponseHelper.serverError(res, "Batch operation failed");
    }
  }
);

/**
 * POST /batch/sync - Get data changes since last sync
 */
router.post(
  "/sync",
  requireAuth,
  validateRequest({
    body: syncSchema,
  }),
  async (req, res) => {
    try {
      const { lastSync } = req.body;
      const userId = req.user!.id;

      const syncData = await BatchService.getSyncData(userId, lastSync);

      logger.info("Sync data retrieved:", {
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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return ResponseHelper.success(res, syncData);
    } catch (error: any) {
      logger.error("Sync data fetch failed:", error);
      return ResponseHelper.serverError(res, "Failed to fetch sync data");
    }
  }
);

/**
 * POST /batch/fetch - Bulk fetch multiple resources
 */
router.post(
  "/fetch",
  requireAuth,
  validateRequest({
    body: bulkFetchSchema,
  }),
  async (req, res) => {
    try {
      const { requests } = req.body;

      // Limit bulk fetch size
      const totalIds = requests.reduce((sum, req) => sum + req.ids.length, 0);
      if (totalIds > 200) {
        return ResponseHelper.error(
          res,
          "BULK_FETCH_TOO_LARGE",
          "Maximum 200 total IDs per bulk fetch",
          400,
          { maxIds: 200, received: totalIds },
          false
        );
      }

      const results = await BatchService.bulkFetch(requests);

      logger.info("Bulk fetch completed:", {
        userId: req.user!.id,
        requestCount: requests.length,
        totalIds,
        requestId: res.locals.requestId,
      });

      // Add cache headers for bulk fetch
      res.set({
        "Cache-Control": "public, max-age=300", // 5 minutes cache
        ETag: `"bulk-${Date.now()}"`,
      });

      return ResponseHelper.success(res, results);
    } catch (error: any) {
      logger.error("Bulk fetch failed:", error);
      return ResponseHelper.serverError(res, "Bulk fetch failed");
    }
  }
);

/**
 * GET /batch/health - Batch service health check
 */
router.get("/health", async (_req, res) => {
  try {
    // Simple health check - try to query the database
    await BatchService.bulkFetch([{ resource: "users", ids: [] }]);

    return ResponseHelper.success(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      capabilities: ["batch_operations", "data_sync", "bulk_fetch"],
    });
  } catch (error: any) {
    logger.error("Batch service health check failed:", error);
    return ResponseHelper.serverError(res, "Batch service unhealthy");
  }
});

export default router;
