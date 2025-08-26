import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { ModerationService } from '../services/moderation.service';

const router = Router();

// Admin middleware (simplified - in production, use proper role checking)
const requireAdmin = (req: any, res: any, next: any) => {
  // Check if user is admin (you'd implement proper admin role checking)
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  next();
};

// Validation schemas
const reportSchema = z.object({
  reportedId: z.string(),
  type: z.enum(['profile', 'message', 'photo', 'behavior']),
  reason: z.string().min(1),
  description: z.string().optional(),
  contentId: z.string().optional(),
});

const reportsQuerySchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved']).optional(),
  type: z.enum(['profile', 'message', 'photo', 'behavior']).optional(),
  limit: z.string().transform(Number).optional(),
  page: z.string().transform(Number).optional(),
});

const updateReportSchema = z.object({
  status: z.enum(['reviewed', 'resolved']),
  action: z.enum(['warn', 'suspend', 'ban', 'dismiss']).optional(),
  adminNotes: z.string().optional(),
});

const reportParamsSchema = z.object({
  reportId: z.string(),
});

const userParamsSchema = z.object({
  userId: z.string(),
});

// POST /report - Create a report
router.post(
  '/report',
  requireAuth,
  validateRequest({ body: reportSchema }),
  async (req: any, res: any) => {
    try {
      const reporterId = req.user.id;
      const reportData = {
        reporterId,
        ...req.body,
      };

      const report = await ModerationService.createReport(reportData);

      res.status(201).json({
        success: true,
        data: report,
        message: 'Report submitted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /reports - Get reports (admin only)
router.get(
  '/reports',
  requireAuth,
  requireAdmin,
  validateRequest({ query: reportsQuerySchema }),
  async (req: any, res: any) => {
    try {
      const filters = req.query;
      const result = await ModerationService.getReports(filters);

      res.json({
        success: true,
        data: result.reports,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// PUT /reports/:reportId - Update report status (admin only)
router.put(
  '/reports/:reportId',
  requireAuth,
  requireAdmin,
  validateRequest({ params: reportParamsSchema, body: updateReportSchema }),
  async (req: any, res: any) => {
    try {
      const { reportId } = req.params;
      const { status, action, adminNotes } = req.body;

      await ModerationService.updateReportStatus(reportId, status, action, adminNotes);

      res.json({
        success: true,
        message: 'Report updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /user/:userId/history - Get user moderation history (admin only)
router.get(
  '/user/:userId/history',
  requireAuth,
  requireAdmin,
  validateRequest({ params: userParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const history = await ModerationService.getUserModerationHistory(userId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /user/:userId/suspended - Check if user is suspended
router.get(
  '/user/:userId/suspended',
  requireAuth,
  requireAdmin,
  validateRequest({ params: userParamsSchema }),
  async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const isSuspended = await ModerationService.isUserSuspended(userId);

      res.json({
        success: true,
        data: { isSuspended },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
