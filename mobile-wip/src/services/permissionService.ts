/**
 * Permission Service
 * User permissions, role-based access control, and feature flags
 */

export enum Permission {
  // User permissions
  VIEW_PROFILE = "view_profile",
  EDIT_PROFILE = "edit_profile",
  DELETE_PROFILE = "delete_profile",

  // Matching permissions
  VIEW_MATCHES = "view_matches",
  CREATE_MATCHES = "create_matches",
  LIKE_PROFILES = "like_profiles",
  SUPER_LIKE = "super_like",

  // Messaging permissions
  SEND_MESSAGES = "send_messages",
  RECEIVE_MESSAGES = "receive_messages",
  SEND_MEDIA = "send_media",
  DELETE_MESSAGES = "delete_messages",

  // Media permissions
  UPLOAD_PHOTOS = "upload_photos",
  UPLOAD_VIDEOS = "upload_videos",
  DELETE_MEDIA = "delete_media",
  MODERATE_MEDIA = "moderate_media",

  // Community permissions
  JOIN_COMMUNITIES = "join_communities",
  CREATE_COMMUNITIES = "create_communities",
  MODERATE_COMMUNITIES = "moderate_communities",
  DELETE_COMMUNITIES = "delete_communities",

  // Premium features
  UNLIMITED_LIKES = "unlimited_likes",
  SEE_WHO_LIKED = "see_who_liked",
  BOOST_PROFILE = "boost_profile",
  SUPER_BOOST = "super_boost",
  REWIND_SWIPES = "rewind_swipes",

  // Administrative permissions
  ADMIN_PANEL = "admin_panel",
  MANAGE_USERS = "manage_users",
  MANAGE_REPORTS = "manage_reports",
  SYSTEM_SETTINGS = "system_settings",
}

export enum UserRole {
  GUEST = "guest",
  USER = "user",
  PREMIUM = "premium",
  VIP = "vip",
  MODERATOR = "moderator",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum SubscriptionTier {
  FREE = "free",
  BASIC = "basic",
  PREMIUM = "premium",
  VIP = "vip",
}

export interface UserPermissions {
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  permissions: Permission[];
  features: string[];
  restrictions: PermissionRestriction[];
}

export interface PermissionRestriction {
  permission: Permission;
  limit?: number;
  period?: "daily" | "weekly" | "monthly";
  remaining?: number;
  resetTime?: Date;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

class PermissionService {
  private userPermissions: UserPermissions | null = null;
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private permissionCache: Map<string, boolean> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  // Permission mappings by role
  private static readonly ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.GUEST]: [Permission.VIEW_PROFILE],
    [UserRole.USER]: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_MATCHES,
      Permission.CREATE_MATCHES,
      Permission.LIKE_PROFILES,
      Permission.SEND_MESSAGES,
      Permission.RECEIVE_MESSAGES,
      Permission.UPLOAD_PHOTOS,
      Permission.JOIN_COMMUNITIES,
    ],
    [UserRole.PREMIUM]: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_MATCHES,
      Permission.CREATE_MATCHES,
      Permission.LIKE_PROFILES,
      Permission.SUPER_LIKE,
      Permission.SEND_MESSAGES,
      Permission.RECEIVE_MESSAGES,
      Permission.SEND_MEDIA,
      Permission.UPLOAD_PHOTOS,
      Permission.UPLOAD_VIDEOS,
      Permission.JOIN_COMMUNITIES,
      Permission.UNLIMITED_LIKES,
      Permission.SEE_WHO_LIKED,
      Permission.BOOST_PROFILE,
    ],
    [UserRole.VIP]: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_MATCHES,
      Permission.CREATE_MATCHES,
      Permission.LIKE_PROFILES,
      Permission.SUPER_LIKE,
      Permission.SEND_MESSAGES,
      Permission.RECEIVE_MESSAGES,
      Permission.SEND_MEDIA,
      Permission.UPLOAD_PHOTOS,
      Permission.UPLOAD_VIDEOS,
      Permission.JOIN_COMMUNITIES,
      Permission.CREATE_COMMUNITIES,
      Permission.UNLIMITED_LIKES,
      Permission.SEE_WHO_LIKED,
      Permission.BOOST_PROFILE,
      Permission.SUPER_BOOST,
      Permission.REWIND_SWIPES,
    ],
    [UserRole.MODERATOR]: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.VIEW_MATCHES,
      Permission.CREATE_MATCHES,
      Permission.LIKE_PROFILES,
      Permission.SUPER_LIKE,
      Permission.SEND_MESSAGES,
      Permission.RECEIVE_MESSAGES,
      Permission.SEND_MEDIA,
      Permission.UPLOAD_PHOTOS,
      Permission.UPLOAD_VIDEOS,
      Permission.DELETE_MEDIA,
      Permission.MODERATE_MEDIA,
      Permission.JOIN_COMMUNITIES,
      Permission.CREATE_COMMUNITIES,
      Permission.MODERATE_COMMUNITIES,
      Permission.MANAGE_REPORTS,
    ],
    [UserRole.ADMIN]: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE,
      Permission.DELETE_PROFILE,
      Permission.VIEW_MATCHES,
      Permission.CREATE_MATCHES,
      Permission.LIKE_PROFILES,
      Permission.SUPER_LIKE,
      Permission.SEND_MESSAGES,
      Permission.RECEIVE_MESSAGES,
      Permission.SEND_MEDIA,
      Permission.DELETE_MESSAGES,
      Permission.UPLOAD_PHOTOS,
      Permission.UPLOAD_VIDEOS,
      Permission.DELETE_MEDIA,
      Permission.MODERATE_MEDIA,
      Permission.JOIN_COMMUNITIES,
      Permission.CREATE_COMMUNITIES,
      Permission.MODERATE_COMMUNITIES,
      Permission.DELETE_COMMUNITIES,
      Permission.ADMIN_PANEL,
      Permission.MANAGE_USERS,
      Permission.MANAGE_REPORTS,
    ],
    [UserRole.SUPER_ADMIN]: Object.values(Permission),
  };

  // Default restrictions by subscription tier
  private static readonly TIER_RESTRICTIONS: Record<
    SubscriptionTier,
    PermissionRestriction[]
  > = {
    [SubscriptionTier.FREE]: [
      {
        permission: Permission.LIKE_PROFILES,
        limit: 10,
        period: "daily",
      },
      {
        permission: Permission.SUPER_LIKE,
        limit: 1,
        period: "daily",
      },
      {
        permission: Permission.BOOST_PROFILE,
        limit: 1,
        period: "monthly",
      },
    ],
    [SubscriptionTier.BASIC]: [
      {
        permission: Permission.LIKE_PROFILES,
        limit: 50,
        period: "daily",
      },
      {
        permission: Permission.SUPER_LIKE,
        limit: 5,
        period: "daily",
      },
      {
        permission: Permission.BOOST_PROFILE,
        limit: 5,
        period: "monthly",
      },
    ],
    [SubscriptionTier.PREMIUM]: [
      {
        permission: Permission.SUPER_LIKE,
        limit: 25,
        period: "daily",
      },
      {
        permission: Permission.SUPER_BOOST,
        limit: 1,
        period: "weekly",
      },
    ],
    [SubscriptionTier.VIP]: [
      // No restrictions for VIP
    ],
  };

  /**
   * Initialize permission service with user data
   */
  public async initialize(userPermissions: UserPermissions): Promise<void> {
    this.userPermissions = userPermissions;
    this.clearCache();

    // Load feature flags
    await this.loadFeatureFlags();
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: Permission): boolean {
    if (!this.userPermissions) return false;

    const cacheKey = `permission_${permission}`;

    // Check cache first
    if (this.isCacheValid() && this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey) || false;
    }

    let hasPermission = false;

    // Check direct permissions
    if (this.userPermissions.permissions.includes(permission)) {
      hasPermission = true;
    } else {
      // Check role-based permissions
      const rolePermissions =
        PermissionService.ROLE_PERMISSIONS[this.userPermissions.role] || [];
      hasPermission = rolePermissions.includes(permission);
    }

    // Check restrictions
    if (hasPermission) {
      hasPermission = !this.isRestricted(permission);
    }

    // Cache result
    this.permissionCache.set(cacheKey, hasPermission);

    return hasPermission;
  }

  /**
   * Check multiple permissions (all must be granted)
   */
  public hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Check if permission is restricted by limits
   */
  public isRestricted(permission: Permission): boolean {
    if (!this.userPermissions) return true;

    const restriction = this.userPermissions.restrictions.find(
      (r) => r.permission === permission
    );
    if (!restriction || !restriction.limit) return false;

    return (restriction.remaining || 0) <= 0;
  }

  /**
   * Get permission restriction details
   */
  public getRestriction(permission: Permission): PermissionRestriction | null {
    if (!this.userPermissions) return null;
    return (
      this.userPermissions.restrictions.find(
        (r) => r.permission === permission
      ) || null
    );
  }

  /**
   * Use/consume permission (decrements remaining count)
   */
  public async usePermission(permission: Permission): Promise<boolean> {
    if (!this.hasPermission(permission)) return false;

    if (!this.userPermissions) return false;

    const restriction = this.userPermissions.restrictions.find(
      (r) => r.permission === permission
    );
    if (
      restriction &&
      restriction.limit &&
      restriction.remaining !== undefined
    ) {
      restriction.remaining = Math.max(0, restriction.remaining - 1);

      // Clear cache to reflect new state
      this.clearCache();
    }

    return true;
  }

  /**
   * Check feature flag status
   */
  public isFeatureEnabled(featureName: string): boolean {
    const flag = this.featureFlags.get(featureName);
    if (!flag) return false;

    // Check if feature is globally enabled
    if (!flag.enabled) return false;

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userId = this.userPermissions?.role || "anonymous";
      const hash = this.hashString(userId + featureName);
      const userPercentage = (hash % 100) + 1;
      if (userPercentage > flag.rolloutPercentage) return false;
    }

    // Check user groups
    if (flag.userGroups && flag.userGroups.length > 0) {
      const userRole = this.userPermissions?.role;
      if (!userRole || !flag.userGroups.includes(userRole)) return false;
    }

    return true;
  }

  /**
   * Get all enabled features for current user
   */
  public getEnabledFeatures(): string[] {
    const enabledFeatures: string[] = [];

    for (const [featureName] of this.featureFlags) {
      if (this.isFeatureEnabled(featureName)) {
        enabledFeatures.push(featureName);
      }
    }

    return enabledFeatures;
  }

  /**
   * Check if user can perform action based on role hierarchy
   */
  public canPerformAction(action: string, targetRole?: UserRole): boolean {
    if (!this.userPermissions) return false;

    const userRole = this.userPermissions.role;

    // Super admin can do everything
    if (userRole === UserRole.SUPER_ADMIN) return true;

    // Check role hierarchy for user management actions
    if (targetRole && this.isUserManagementAction(action)) {
      const userLevel = this.getRoleLevel(userRole);
      const targetLevel = this.getRoleLevel(targetRole);
      return userLevel > targetLevel;
    }

    // For other actions, check specific permissions
    const permission = this.getPermissionForAction(action);
    return permission ? this.hasPermission(permission) : false;
  }

  /**
   * Get user's role level (higher = more privileged)
   */
  private getRoleLevel(role: UserRole): number {
    const levels = {
      [UserRole.GUEST]: 0,
      [UserRole.USER]: 1,
      [UserRole.PREMIUM]: 2,
      [UserRole.VIP]: 3,
      [UserRole.MODERATOR]: 4,
      [UserRole.ADMIN]: 5,
      [UserRole.SUPER_ADMIN]: 6,
    };
    return levels[role] || 0;
  }

  /**
   * Check if action is user management related
   */
  private isUserManagementAction(action: string): boolean {
    const managementActions = [
      "ban_user",
      "unban_user",
      "delete_user",
      "modify_user_role",
      "view_user_details",
    ];
    return managementActions.includes(action);
  }

  /**
   * Map action to permission
   */
  private getPermissionForAction(action: string): Permission | null {
    const actionPermissionMap: Record<string, Permission> = {
      view_profile: Permission.VIEW_PROFILE,
      edit_profile: Permission.EDIT_PROFILE,
      delete_profile: Permission.DELETE_PROFILE,
      send_message: Permission.SEND_MESSAGES,
      upload_photo: Permission.UPLOAD_PHOTOS,
      like_profile: Permission.LIKE_PROFILES,
      super_like: Permission.SUPER_LIKE,
      boost_profile: Permission.BOOST_PROFILE,
      manage_users: Permission.MANAGE_USERS,
      admin_panel: Permission.ADMIN_PANEL,
    };

    return actionPermissionMap[action] || null;
  }

  /**
   * Load feature flags from server or cache
   */
  private async loadFeatureFlags(): Promise<void> {
    try {
      // In a real implementation, this would load from API
      // For now, we'll set some default feature flags
      this.featureFlags.set("new_matching_algorithm", {
        name: "new_matching_algorithm",
        enabled: true,
        rolloutPercentage: 50,
      });

      this.featureFlags.set("video_calls", {
        name: "video_calls",
        enabled: true,
        userGroups: [UserRole.PREMIUM, UserRole.VIP],
      });

      this.featureFlags.set("advanced_filters", {
        name: "advanced_filters",
        enabled: true,
        userGroups: [UserRole.PREMIUM, UserRole.VIP],
      });
    } catch (error) {
      console.error("Failed to load feature flags:", error);
    }
  }

  /**
   * Hash string for consistent percentage calculations
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  /**
   * Clear permission cache
   */
  private clearCache(): void {
    this.permissionCache.clear();
    this.lastCacheUpdate = Date.now();
  }

  /**
   * Get user's current role
   */
  public getUserRole(): UserRole | null {
    return this.userPermissions?.role || null;
  }

  /**
   * Get user's subscription tier
   */
  public getSubscriptionTier(): SubscriptionTier | null {
    return this.userPermissions?.subscriptionTier || null;
  }

  /**
   * Get all user permissions
   */
  public getAllPermissions(): Permission[] {
    return this.userPermissions?.permissions || [];
  }

  /**
   * Check if user is premium (any paid tier)
   */
  public isPremium(): boolean {
    const tier = this.getSubscriptionTier();
    return tier !== null && tier !== SubscriptionTier.FREE;
  }

  /**
   * Check if user is admin or higher
   */
  public isAdmin(): boolean {
    const role = this.getUserRole();
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Check if user is moderator or higher
   */
  public isModerator(): boolean {
    const role = this.getUserRole();
    return role === UserRole.MODERATOR || this.isAdmin();
  }

  /**
   * Refresh permissions from server
   */
  public async refreshPermissions(): Promise<void> {
    try {
      // In a real implementation, this would fetch fresh permissions from API
      this.clearCache();
      await this.loadFeatureFlags();
    } catch (error) {
      console.error("Failed to refresh permissions:", error);
    }
  }

  /**
   * Update feature flag
   */
  public updateFeatureFlag(flag: FeatureFlag): void {
    this.featureFlags.set(flag.name, flag);
  }

  /**
   * Get permission summary for debugging
   */
  public getPermissionSummary(): {
    role: UserRole | null;
    subscriptionTier: SubscriptionTier | null;
    permissions: Permission[];
    restrictions: PermissionRestriction[];
    enabledFeatures: string[];
  } {
    return {
      role: this.getUserRole(),
      subscriptionTier: this.getSubscriptionTier(),
      permissions: this.getAllPermissions(),
      restrictions: this.userPermissions?.restrictions || [],
      enabledFeatures: this.getEnabledFeatures(),
    };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
export default permissionService;
