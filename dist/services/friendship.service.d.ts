export declare class FriendshipService {
    static sendFriendRequest(requesterId: string, addresseeId: string): Promise<any>;
    static respondToFriendRequest(friendshipId: string, userId: string, accept: boolean): Promise<any>;
    static getFriends(userId: string): Promise<any>;
    static getPendingRequests(userId: string): Promise<any>;
}
//# sourceMappingURL=friendship.service.d.ts.map