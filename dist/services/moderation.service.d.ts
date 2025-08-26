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
    static createReport(data: ReportData): Promise<any>;
    private static checkReportThreshold;
    static getReports(filters: {
        status?: "pending" | "reviewed" | "resolved";
        type?: "profile" | "message" | "photo" | "behavior";
        limit?: number;
        page?: number;
    }): Promise<{
        reports: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
        };
    }>;
    static updateReportStatus(reportId: string, status: "reviewed" | "resolved", action?: "warn" | "suspend" | "ban" | "dismiss", adminNotes?: string): Promise<{
        success: boolean;
    }>;
    private static takeActionOnUser;
    static isUserSuspended(userId: string): Promise<boolean>;
    static getUserModerationHistory(userId: string): Promise<{
        reportsSubmitted: any;
        reportsReceived: any;
        warnings: any;
    }>;
}
export {};
//# sourceMappingURL=moderation.service.d.ts.map