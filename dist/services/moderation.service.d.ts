interface ModerationResult {
    isApproved: boolean;
    reason?: string | undefined;
    confidence: number;
    flags: string[];
}
interface ReportData {
    reporterId: string;
    reportedId: string;
    reason: string;
    description?: string;
    contentId?: string;
}
export declare class ModerationService {
    static moderateText(content: string): ModerationResult;
    private static isSpamLike;
    private static hasContactInfo;
    static createReport(data: ReportData): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        reporterId: string;
        reportedId: string;
        reason: string;
        details: string | null;
    }>;
    private static checkReportThreshold;
    static getReports(filters: {
        status?: "pending" | "reviewed" | "resolved";
        type?: "profile" | "message" | "photo" | "behavior";
        limit?: number;
        page?: number;
    }): Promise<{
        reports: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            reporterId: string;
            reportedId: string;
            reason: string;
            details: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    static updateReportStatus(reportId: string, status: "reviewed" | "resolved", action?: "warn" | "suspend" | "ban" | "dismiss", adminNotes?: string): Promise<{
        success: boolean;
    }>;
    private static takeActionOnUser;
    static isUserSuspended(userId: string): Promise<boolean>;
    static getUserModerationHistory(userId: string): Promise<{
        reportsSubmitted: number;
        reportsReceived: number;
        warnings: number;
    }>;
}
export {};
//# sourceMappingURL=moderation.service.d.ts.map