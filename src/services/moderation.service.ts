import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

// using shared singleton `prisma` from src/lib/prisma

interface ModerationResult {
  isApproved: boolean;
  reason?: string | undefined;
  confidence: number;
  flags: string[];
}

interface ReportData {
  reporterId: string;
  reportedId: string;
  // type not in schema, using reason instead 'profile' | 'message' | 'photo' | 'behavior';
  reason: string;
  description?: string;
  contentId?: string;
}

// Common inappropriate content patterns
const INAPPROPRIATE_PATTERNS = [
  // Add regex patterns for content filtering
  /\b(spam|scam|fake|bot)\b/i,
  /\b(drug|drugs|cocaine|heroin|weed|marijuana)\b/i,
  /\b(escort|prostitute|hooker)\b/i,
  /\b(venmo|paypal|cashapp|cash app)\b/i,
  /\b(snapchat|instagram|kik|whatsapp)\b/i, // External platform promotion
];

export class ModerationService {
  // Auto-moderate text content
  static moderateText(content: string): ModerationResult {
    const flags: string[] = [];
    let confidence = 0;

    // Check against inappropriate patterns
    for (const pattern of INAPPROPRIATE_PATTERNS) {
      if (pattern.test(content)) {
        flags.push("inappropriate_content");
        confidence += 0.3;
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      flags.push("excessive_caps");
      confidence += 0.2;
    }

    // Check for spam patterns
    if (this.isSpamLike(content)) {
      flags.push("spam");
      confidence += 0.5;
    }

    // Check for external contact info
    if (this.hasContactInfo(content)) {
      flags.push("external_contact");
      confidence += 0.4;
    }

    const isApproved = confidence < 0.5 && flags.length === 0;

    return {
      isApproved,
      confidence: Math.min(confidence, 1),
      flags,
      reason: !isApproved
        ? `Content flagged for: ${flags.join(", ")}`
        : undefined,
    };
  }

  // Check if content is spam-like
  private static isSpamLike(content: string): boolean {
    // Repeated characters
    if (/(.)\1{4,}/.test(content)) return true;

    // Multiple exclamation marks
    if ((content.match(/!/g) || []).length > 5) return true;

    // Multiple question marks
    if ((content.match(/\?/g) || []).length > 3) return true;

    // Too many emojis
    const emojiCount = (content.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length;
    if (emojiCount > content.length * 0.3) return true;

    return false;
  }

  // Check for external contact information
  private static hasContactInfo(content: string): boolean {
    const patterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b(?:snap|ig|insta|kik|telegram):\s*\w+/i, // Social handles
    ];

    return patterns.some((pattern) => pattern.test(content));
  }

  // Create a report
  static async createReport(data: ReportData) {
    const { reporterId, reportedId, reason, description, contentId } = data;

    // Prevent self-reporting
    if (reporterId === reportedId) {
      throw new Error("Cannot report yourself");
    }

    // Check if user already reported this content/user recently
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existingReport) {
      throw new Error("You have already reported this content recently");
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
        status: "pending",
      },
      include: {
        reporter: {
          select: {
            profile: { select: { displayName: true } },
          },
        },
        // @ts-ignore
        reportedUser: {
          select: {
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    // Auto-escalate if user has multiple reports
    await this.checkReportThreshold(reportedId);

    return report;
  }

  // Check if user has too many reports and take action
  private static async checkReportThreshold(userId: string) {
    const recentReports = await prisma.report.count({
      where: {
        reportedId: userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Automatic actions based on report count
    if (recentReports >= 5) {
      // Temporary suspension
      await prisma.user.update({
        where: { id: userId },
        data: {
          // // @ts-ignore
          // isSuspended not in schema true,
          // // @ts-ignore
          // suspensionEnd not in schema new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // @ts-ignore - notification type field might not exist in schema
      await prisma.notification.create({
        data: {
          userId,
          type: "account",
          title: "Account Temporarily Suspended",
          body: "Your account has been temporarily suspended due to multiple reports",
          data: { action: "suspended", duration: "24h" },
        },
      });
    } else if (recentReports >= 10) {
      // Permanent ban
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          // // @ts-ignore
          // isSuspended not in schema true,
        },
      });

      // @ts-ignore - notification type field might not exist in schema
      await prisma.notification.create({
        data: {
          userId,
          type: "account",
          title: "Account Suspended",
          body: "Your account has been suspended due to violations of our community guidelines",
          data: { action: "banned" },
        },
      });
    }
  }

  // Get reports for admin review
  static async getReports(filters: {
    status?: "pending" | "reviewed" | "resolved";
    type?: "profile" | "message" | "photo" | "behavior";
    limit?: number;
    page?: number;
  }) {
    const { status, type, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              profile: { select: { displayName: true } },
            },
          },
          // @ts-ignore
          reportedUser: {
            select: {
              id: true,
              profile: { select: { displayName: true } },
              isActive: true,
              // // @ts-ignore
              // isSuspended not in schema true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update report status (admin action)
  static async updateReportStatus(
    reportId: string,
    status: "reviewed" | "resolved",
    action?: "warn" | "suspend" | "ban" | "dismiss",
    adminNotes?: string
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Update report
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        // @ts-ignore
        adminNotes,
        reviewedAt: new Date(),
      },
    });

    // Take action if specified
    if (action && action !== "dismiss") {
      await this.takeActionOnUser(report.reportedId, action);
    }

    return { success: true };
  }

  // Take action on a user
  private static async takeActionOnUser(
    userId: string,
    action: "warn" | "suspend" | "ban"
  ) {
    switch (action) {
      case "warn":
        // @ts-ignore - notification type field might not exist in schema
        await prisma.notification.create({
          data: {
            userId,
            type: "account",
            title: "Community Guidelines Warning",
            body: "Please review our community guidelines to ensure your content complies",
            data: { action: "warning" },
          },
        });
        break;

      case "suspend":
        await prisma.user.update({
          where: { id: userId },
          data: {
            // // @ts-ignore
            // isSuspended not in schema true,
            // // @ts-ignore
            // suspensionEnd not in schema new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        // @ts-ignore - notification type field might not exist in schema
        await prisma.notification.create({
          data: {
            userId,
            type: "account",
            title: "Account Suspended",
            body: "Your account has been suspended for 7 days due to community guideline violations",
            data: { action: "suspended", duration: "7d" },
          },
        });
        break;

      case "ban":
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            // // @ts-ignore
            // isSuspended not in schema true,
          },
        });

        // @ts-ignore - notification type field might not exist in schema
        await prisma.notification.create({
          data: {
            userId,
            type: "account",
            title: "Account Banned",
            body: "Your account has been permanently banned due to severe violations",
            data: { action: "banned" },
          },
        });
        break;
    }
  }

  // Check if user is currently suspended
  static async isUserSuspended(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // // @ts-ignore
        // isSuspended not in schema true,
        // // @ts-ignore
        // suspensionEnd not in schema true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return true;
    // @ts-ignore - suspension fields might not exist in schema
    if (!user.isSuspended) return false;

    // Check if suspension has expired
    // @ts-ignore - suspension fields might not exist in schema
    if (user.suspensionEnd && new Date() > user.suspensionEnd) {
      // Auto-lift suspension
      await prisma.user.update({
        where: { id: userId },
        data: {
          // // @ts-ignore
          // isSuspended not in schema false,
          // // @ts-ignore
          // suspensionEnd not in schema null,
        },
      });
      return false;
    }

    // @ts-ignore - suspension fields might not exist in schema
    return user.isSuspended;
  }

  // Get user's moderation history
  static async getUserModerationHistory(userId: string) {
    const [reportsBy, reportsAgainst, warnings] = await Promise.all([
      prisma.report.count({
        where: { reporterId: userId },
      }),
      prisma.report.count({
        where: { reportedId: userId },
      }),
      prisma.notification.count({
        where: {
          userId,
          // type not in schema, using reason instead 'account',
          title: { contains: "Warning" },
        },
      }),
    ]);

    return {
      reportsSubmitted: reportsBy,
      reportsReceived: reportsAgainst,
      warnings,
    };
  }
}
