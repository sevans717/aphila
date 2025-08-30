"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const analytics_service_1 = require("../services/analytics.service");
const router = (0, express_1.Router)();
// Validation schemas
const createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(50),
        description: zod_1.z.string().max(500).optional(),
        type: zod_1.z
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
const updateCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(50).optional(),
        description: zod_1.z.string().max(500).optional(),
        type: zod_1.z
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
        isActive: zod_1.z.boolean().optional(),
    }),
});
const categoryParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
const categoriesQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z
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
        isActive: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional()
            .default(true),
        limit: zod_1.z
            .string()
            .transform(Number)
            .optional()
            .default(() => 50),
        offset: zod_1.z
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
router.get("/", (0, validate_1.validateRequest)({ query: categoriesQuerySchema.shape.query }), async (req, res) => {
    try {
        const { type, isActive, limit, offset } = req.validatedQuery;
        const where = {};
        if (type)
            where.type = type;
        if (isActive !== undefined)
            where.isActive = isActive;
        const categories = await prisma_1.prisma.category.findMany({
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
        const total = await prisma_1.prisma.category.count({ where });
        return response_1.ResponseHelper.success(res, {
            categories,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get categories:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get categories");
    }
});
/**
 * Get category by ID
 * GET /api/v1/categories/:id
 */
router.get("/:id", (0, validate_1.validateRequest)({ params: categoryParamsSchema.shape.params }), async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma_1.prisma.category.findUnique({
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
            return response_1.ResponseHelper.notFound(res, "Category");
        }
        return response_1.ResponseHelper.success(res, category);
    }
    catch (error) {
        logger_1.logger.error("Failed to get category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get category");
    }
});
/**
 * Create category (admin only)
 * POST /api/v1/categories
 */
router.post("/", auth_1.requireAuth, (0, validate_1.validateRequest)({ body: createCategorySchema.shape.body }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, type } = req.body;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return response_1.ResponseHelper.error(res, "FORBIDDEN", "Only administrators can create categories", 403);
        }
        // Check if category with this name already exists
        const existingCategory = await prisma_1.prisma.category.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
        });
        if (existingCategory) {
            return response_1.ResponseHelper.error(res, "CONFLICT", "Category with this name already exists", 409);
        }
        // Generate slug from name
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const category = await prisma_1.prisma.category.create({
            data: {
                name,
                slug,
                description,
                type: type,
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
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "category_created",
            properties: {
                categoryId: category.id,
                categoryName: name,
                categoryType: type,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track category creation analytics:", err);
        });
        logger_1.logger.info("Category created:", {
            categoryId: category.id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, category, 201);
    }
    catch (error) {
        logger_1.logger.error("Failed to create category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to create category");
    }
});
/**
 * Update category (admin only)
 * PUT /api/v1/categories/:id
 */
router.put("/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({
    params: updateCategorySchema.shape.params,
    body: updateCategorySchema.shape.body,
}), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return response_1.ResponseHelper.error(res, "FORBIDDEN", "Only administrators can update categories", 403);
        }
        // Check if category exists
        const existingCategory = await prisma_1.prisma.category.findUnique({
            where: { id },
        });
        if (!existingCategory) {
            return response_1.ResponseHelper.notFound(res, "Category");
        }
        // If updating name, check for conflicts and update slug
        if (updateData.name) {
            const conflictingCategory = await prisma_1.prisma.category.findFirst({
                where: {
                    name: { equals: updateData.name, mode: "insensitive" },
                    id: { not: id },
                },
            });
            if (conflictingCategory) {
                return response_1.ResponseHelper.error(res, "CONFLICT", "Category with this name already exists", 409);
            }
            // Generate new slug
            updateData.slug = updateData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        }
        const category = await prisma_1.prisma.category.update({
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
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "category_updated",
            properties: {
                categoryId: id,
                fieldsUpdated: Object.keys(updateData),
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track category update analytics:", err);
        });
        logger_1.logger.info("Category updated:", {
            categoryId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, category);
    }
    catch (error) {
        logger_1.logger.error("Failed to update category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to update category");
    }
});
/**
 * Delete category (admin only)
 * DELETE /api/v1/categories/:id
 */
router.delete("/:id", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: categoryParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if user is admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
            return response_1.ResponseHelper.error(res, "FORBIDDEN", "Only administrators can delete categories", 403);
        }
        // Check if category exists
        const category = await prisma_1.prisma.category.findUnique({
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
            return response_1.ResponseHelper.notFound(res, "Category");
        }
        // Check if category has communities (prevent deletion if it does)
        if (category._count.communities > 0) {
            return response_1.ResponseHelper.error(res, "CONFLICT", "Cannot delete category with existing communities", 409);
        }
        // Delete the category
        await prisma_1.prisma.category.delete({
            where: { id },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "category_deleted",
            properties: {
                categoryId: id,
                categoryName: category.name,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track category deletion analytics:", err);
        });
        logger_1.logger.info("Category deleted:", {
            categoryId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { deleted: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to delete category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to delete category");
    }
});
/**
 * Join category
 * POST /api/v1/categories/:id/join
 */
router.post("/:id/join", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: categoryParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if category exists
        const category = await prisma_1.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            return response_1.ResponseHelper.notFound(res, "Category");
        }
        // Check if already a member
        const existingMembership = await prisma_1.prisma.categoryMembership.findUnique({
            where: {
                userId_categoryId: {
                    userId,
                    categoryId: id,
                },
            },
        });
        if (existingMembership) {
            return response_1.ResponseHelper.error(res, "CONFLICT", "Already a member of this category", 409);
        }
        // Create membership
        const membership = await prisma_1.prisma.categoryMembership.create({
            data: {
                userId,
                categoryId: id,
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "category_joined",
            properties: {
                categoryId: id,
                categoryName: category.name,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track category join analytics:", err);
        });
        logger_1.logger.info("Category joined:", {
            categoryId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, {
            membership,
            category: {
                id: category.id,
                name: category.name,
                description: category.description,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to join category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to join category");
    }
});
/**
 * Leave category
 * DELETE /api/v1/categories/:id/leave
 */
router.delete("/:id/leave", auth_1.requireAuth, (0, validate_1.validateRequest)({ params: categoryParamsSchema.shape.params }), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if membership exists
        const membership = await prisma_1.prisma.categoryMembership.findUnique({
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
            return response_1.ResponseHelper.error(res, "NOT_FOUND", "Not a member of this category", 404);
        }
        // Delete membership
        await prisma_1.prisma.categoryMembership.delete({
            where: {
                userId_categoryId: {
                    userId,
                    categoryId: id,
                },
            },
        });
        // Track analytics
        await analytics_service_1.AnalyticsService.trackEvent({
            userId,
            event: "category_left",
            properties: {
                categoryId: id,
                categoryName: membership.category.name,
            },
        }).catch((err) => {
            logger_1.logger.warn("Failed to track category leave analytics:", err);
        });
        logger_1.logger.info("Category left:", {
            categoryId: id,
            userId,
            requestId: res.locals.requestId,
        });
        return response_1.ResponseHelper.success(res, { left: true });
    }
    catch (error) {
        logger_1.logger.error("Failed to leave category:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to leave category");
    }
});
/**
 * Get category members
 * GET /api/v1/categories/:id/members
 */
router.get("/:id/members", (0, validate_1.validateRequest)({ params: categoryParamsSchema.shape.params }), async (req, res) => {
    try {
        const { id } = req.params;
        const members = await prisma_1.prisma.categoryMembership.findMany({
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
        return response_1.ResponseHelper.success(res, {
            members: members.map((m) => ({
                user: m.user,
                joinedAt: m.joinedAt,
                role: m.role,
            })),
            count: members.length,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get category members:", error);
        return response_1.ResponseHelper.serverError(res, "Failed to get category members");
    }
});
exports.default = router;
//# sourceMappingURL=categories.routes.js.map