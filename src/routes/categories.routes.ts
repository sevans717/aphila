import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { ResponseHelper } from "../utils/response";
import { AnalyticsService } from "../services/analytics.service";

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    type: z
      .enum([
        "ART",
        "FASHION",
        "FOOD",
        "SPORTS",
        "MUSIC",
        "GAMING",
        "TECH",
        "TRAVEL",
        "CASUAL",
        "SERIOUS",
        "FRIENDS",
        "FUN",
      ])
      .optional(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(500).optional(),
    type: z
      .enum([
        "ART",
        "FASHION",
        "FOOD",
        "SPORTS",
        "MUSIC",
        "GAMING",
        "TECH",
        "TRAVEL",
        "CASUAL",
        "SERIOUS",
        "FRIENDS",
        "FUN",
      ])
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const categoriesQuerySchema = z.object({
  query: z.object({
    type: z
      .enum([
        "ART",
        "FASHION",
        "FOOD",
        "SPORTS",
        "MUSIC",
        "GAMING",
        "TECH",
        "TRAVEL",
        "CASUAL",
        "SERIOUS",
        "FRIENDS",
        "FUN",
      ])
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === "true")
      .optional()
      .default(true),
    limit: z
      .string()
      .transform(Number)
      .optional()
      .default(() => 50),
    offset: z
      .string()
      .transform(Number)
      .optional()
      .default(() => 0),
  }),
});

/**
 * Get all categories
 * GET /api/v1/categories
 */
router.get(
  "/",
  validateRequest({ query: categoriesQuerySchema.shape.query }),
  async (req, res) => {
    try {
      const { type, isActive, limit, offset } = req.validatedQuery;

      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive;

      const categories = await prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              memberships: true,
              communities: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      });

      const total = await prisma.category.count({ where });

      return ResponseHelper.success(res, {
        categories,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error: any) {
      logger.error("Failed to get categories:", error);
      return ResponseHelper.serverError(res, "Failed to get categories");
    }
  }
);

/**
 * Get category by ID
 * GET /api/v1/categories/:id
 */
router.get(
  "/:id",
  validateRequest({ params: categoryParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              memberships: true,
              communities: true,
            },
          },
          communities: {
            where: { visibility: "PUBLIC" },
            select: {
              id: true,
              name: true,
              description: true,
              owner: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  memberships: true,
                },
              },
            },
            take: 10,
          },
        },
      });

      if (!category) {
        return ResponseHelper.notFound(res, "Category");
      }

      return ResponseHelper.success(res, category);
    } catch (error: any) {
      logger.error("Failed to get category:", error);
      return ResponseHelper.serverError(res, "Failed to get category");
    }
  }
);

/**
 * Create category (admin only)
 * POST /api/v1/categories
 */
router.post(
  "/",
  requireAuth,
  validateRequest({ body: createCategorySchema.shape.body }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, description, type } = req.body;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return ResponseHelper.error(
          res,
          "FORBIDDEN",
          "Only administrators can create categories",
          403
        );
      }

      // Check if category with this name already exists
      const existingCategory = await prisma.category.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });

      if (existingCategory) {
        return ResponseHelper.error(
          res,
          "CONFLICT",
          "Category with this name already exists",
          409
        );
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          type: type as any,
        },
        include: {
          _count: {
            select: {
              memberships: true,
              communities: true,
            },
          },
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "category_created",
        properties: {
          categoryId: category.id,
          categoryName: name,
          categoryType: type,
        },
      }).catch((err) => {
        logger.warn("Failed to track category creation analytics:", err);
      });

      logger.info("Category created:", {
        categoryId: category.id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, category, 201);
    } catch (error: any) {
      logger.error("Failed to create category:", error);
      return ResponseHelper.serverError(res, "Failed to create category");
    }
  }
);

/**
 * Update category (admin only)
 * PUT /api/v1/categories/:id
 */
router.put(
  "/:id",
  requireAuth,
  validateRequest({
    params: updateCategorySchema.shape.params,
    body: updateCategorySchema.shape.body,
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updateData = req.body;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return ResponseHelper.error(
          res,
          "FORBIDDEN",
          "Only administrators can update categories",
          403
        );
      }

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return ResponseHelper.notFound(res, "Category");
      }

      // If updating name, check for conflicts and update slug
      if (updateData.name) {
        const conflictingCategory = await prisma.category.findFirst({
          where: {
            name: { equals: updateData.name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (conflictingCategory) {
          return ResponseHelper.error(
            res,
            "CONFLICT",
            "Category with this name already exists",
            409
          );
        }

        // Generate new slug
        updateData.slug = updateData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              memberships: true,
              communities: true,
            },
          },
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "category_updated",
        properties: {
          categoryId: id,
          fieldsUpdated: Object.keys(updateData),
        },
      }).catch((err) => {
        logger.warn("Failed to track category update analytics:", err);
      });

      logger.info("Category updated:", {
        categoryId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, category);
    } catch (error: any) {
      logger.error("Failed to update category:", error);
      return ResponseHelper.serverError(res, "Failed to update category");
    }
  }
);

/**
 * Delete category (admin only)
 * DELETE /api/v1/categories/:id
 */
router.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: categoryParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return ResponseHelper.error(
          res,
          "FORBIDDEN",
          "Only administrators can delete categories",
          403
        );
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              communities: true,
              memberships: true,
            },
          },
        },
      });

      if (!category) {
        return ResponseHelper.notFound(res, "Category");
      }

      // Check if category has communities (prevent deletion if it does)
      if (category._count.communities > 0) {
        return ResponseHelper.error(
          res,
          "CONFLICT",
          "Cannot delete category with existing communities",
          409
        );
      }

      // Delete the category
      await prisma.category.delete({
        where: { id },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "category_deleted",
        properties: {
          categoryId: id,
          categoryName: category.name,
        },
      }).catch((err) => {
        logger.warn("Failed to track category deletion analytics:", err);
      });

      logger.info("Category deleted:", {
        categoryId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, { deleted: true });
    } catch (error: any) {
      logger.error("Failed to delete category:", error);
      return ResponseHelper.serverError(res, "Failed to delete category");
    }
  }
);

/**
 * Join category
 * POST /api/v1/categories/:id/join
 */
router.post(
  "/:id/join",
  requireAuth,
  validateRequest({ params: categoryParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return ResponseHelper.notFound(res, "Category");
      }

      // Check if already a member
      const existingMembership = await prisma.categoryMembership.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId: id,
          },
        },
      });

      if (existingMembership) {
        return ResponseHelper.error(
          res,
          "CONFLICT",
          "Already a member of this category",
          409
        );
      }

      // Create membership
      const membership = await prisma.categoryMembership.create({
        data: {
          userId,
          categoryId: id,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "category_joined",
        properties: {
          categoryId: id,
          categoryName: category.name,
        },
      }).catch((err) => {
        logger.warn("Failed to track category join analytics:", err);
      });

      logger.info("Category joined:", {
        categoryId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, {
        membership,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
        },
      });
    } catch (error: any) {
      logger.error("Failed to join category:", error);
      return ResponseHelper.serverError(res, "Failed to join category");
    }
  }
);

/**
 * Leave category
 * DELETE /api/v1/categories/:id/leave
 */
router.delete(
  "/:id/leave",
  requireAuth,
  validateRequest({ params: categoryParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check if membership exists
      const membership = await prisma.categoryMembership.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId: id,
          },
        },
        include: {
          category: true,
        },
      });

      if (!membership) {
        return ResponseHelper.error(
          res,
          "NOT_FOUND",
          "Not a member of this category",
          404
        );
      }

      // Delete membership
      await prisma.categoryMembership.delete({
        where: {
          userId_categoryId: {
            userId,
            categoryId: id,
          },
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        userId,
        event: "category_left",
        properties: {
          categoryId: id,
          categoryName: membership.category.name,
        },
      }).catch((err) => {
        logger.warn("Failed to track category leave analytics:", err);
      });

      logger.info("Category left:", {
        categoryId: id,
        userId,
        requestId: res.locals.requestId,
      });

      return ResponseHelper.success(res, { left: true });
    } catch (error: any) {
      logger.error("Failed to leave category:", error);
      return ResponseHelper.serverError(res, "Failed to leave category");
    }
  }
);

/**
 * Get category members
 * GET /api/v1/categories/:id/members
 */
router.get(
  "/:id/members",
  validateRequest({ params: categoryParamsSchema.shape.params }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const members = await prisma.categoryMembership.findMany({
        where: { categoryId: id },
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatar: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      return ResponseHelper.success(res, {
        members: members.map((m: any) => ({
          user: m.user,
          joinedAt: m.joinedAt,
          role: m.role,
        })),
        count: members.length,
      });
    } catch (error: any) {
      logger.error("Failed to get category members:", error);
      return ResponseHelper.serverError(res, "Failed to get category members");
    }
  }
);

export default router;
