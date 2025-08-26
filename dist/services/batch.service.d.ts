export interface BatchOperation {
    id: string;
    operation: 'create' | 'update' | 'delete';
    resource: string;
    data?: any;
    params?: any;
}
export interface BatchResult {
    id: string;
    success: boolean;
    data?: any;
    error?: string;
}
export interface SyncData {
    lastSync: string;
    updates: {
        communities: any[];
        messages: any[];
        users: any[];
        friendships: any[];
    };
    deletes: {
        messageIds: string[];
        communityIds: string[];
    };
}
export declare class BatchService {
    /**
     * Execute multiple operations in a single transaction
     */
    static executeBatch(operations: BatchOperation[]): Promise<BatchResult[]>;
    /**
     * Get data changes since last sync for offline support
     */
    static getSyncData(userId: string, lastSync: string): Promise<SyncData>;
    /**
     * Bulk fetch multiple resources by IDs
     */
    static bulkFetch(requests: {
        resource: string;
        ids: string[];
    }[]): Promise<any>;
    private static handleMessageOperation;
    private static handleCommunityOperation;
    private static handleUserOperation;
    private static handleFriendshipOperation;
    /**
     * Populate cache with frequently accessed data
     */
    static populateCache(userId: string): Promise<void>;
}
//# sourceMappingURL=batch.service.d.ts.map