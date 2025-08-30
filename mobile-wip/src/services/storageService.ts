import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage Service
 * Secure local storage, caching, and data persistence utilities
 */

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiry?: number; // milliseconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number;
  cacheHitRate: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

class StorageService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private maxCacheSize = 1000; // Maximum number of cached entries
  private defaultExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Storage prefixes for different data types
  private static readonly PREFIXES = {
    USER_DATA: "user_",
    APP_STATE: "app_",
    CACHE: "cache_",
    TEMP: "temp_",
    SECURE: "secure_",
    SETTINGS: "settings_",
  };

  /**
   * Store data with options
   */
  public async set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      let dataToStore: string;

      if (options.expiry) {
        const entry: CacheEntry<T> = {
          data: value,
          timestamp: Date.now(),
          expiry: options.expiry,
        };
        dataToStore = JSON.stringify(entry);
      } else {
        dataToStore = JSON.stringify(value);
      }

      // Encrypt if requested
      if (options.encrypt) {
        dataToStore = this.encrypt(dataToStore);
      }

      // Compress if requested
      if (options.compress) {
        dataToStore = this.compress(dataToStore);
      }

      await AsyncStorage.setItem(fullKey, dataToStore);

      // Update memory cache
      this.updateCache(key, value, options.expiry);
    } catch (error) {
      console.error("Storage set error:", error);
      throw new Error(`Failed to store data for key: ${key}`);
    }
  }

  /**
   * Get data with automatic expiry handling
   */
  public async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      // Check memory cache first
      const cached = this.getFromCache<T>(key);
      if (cached !== null) {
        this.cacheHits++;
        return cached;
      }

      this.cacheMisses++;

      const fullKey = this.getFullKey(key);
      const storedData = await AsyncStorage.getItem(fullKey);

      if (!storedData) {
        return defaultValue ?? null;
      }

      let processedData = storedData;

      // Try to decompress (detect if compressed)
      try {
        processedData = this.decompress(processedData);
      } catch {
        // Not compressed, use as-is
      }

      // Try to decrypt (detect if encrypted)
      try {
        processedData = this.decrypt(processedData);
      } catch {
        // Not encrypted, use as-is
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(processedData);
      } catch {
        // Not JSON, return as string
        return processedData as T;
      }

      // Check if it's a cache entry with expiry
      if (this.isCacheEntry(parsedData)) {
        const entry = parsedData as CacheEntry<T>;

        // Check expiry
        if (entry.expiry && Date.now() - entry.timestamp > entry.expiry) {
          await this.remove(key);
          return defaultValue ?? null;
        }

        // Update memory cache and return data
        this.updateCache(key, entry.data, entry.expiry);
        return entry.data;
      }

      // Regular data, update cache and return
      this.updateCache(key, parsedData);
      return parsedData;
    } catch (error) {
      console.error("Storage get error:", error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove item from storage
   */
  public async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await AsyncStorage.removeItem(fullKey);
      this.cache.delete(key);
    } catch (error) {
      console.error("Storage remove error:", error);
      throw new Error(`Failed to remove data for key: ${key}`);
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache.has(key)) return true;

      const fullKey = this.getFullKey(key);
      const value = await AsyncStorage.getItem(fullKey);
      return value !== null;
    } catch (error) {
      console.error("Storage exists error:", error);
      return false;
    }
  }

  /**
   * Get all keys matching prefix
   */
  public async getKeys(prefix?: string): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const filteredKeys = prefix
        ? allKeys.filter((key) => key.startsWith(this.getFullKey(prefix)))
        : allKeys.filter((key) => key.startsWith(this.getAppPrefix()));

      // Remove app prefix from keys
      return filteredKeys.map((key) => this.removeAppPrefix(key));
    } catch (error) {
      console.error("Storage getKeys error:", error);
      return [];
    }
  }

  /**
   * Get multiple values at once
   */
  public async getMultiple<T>(
    keys: string[]
  ): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    try {
      const fullKeys = keys.map((key) => this.getFullKey(key));
      const values = await AsyncStorage.multiGet(fullKeys);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const storedValue = values[i][1];

        if (storedValue) {
          result[key] = await this.parseStoredValue<T>(storedValue);
        } else {
          result[key] = null;
        }
      }

      return result;
    } catch (error) {
      console.error("Storage getMultiple error:", error);
      return result;
    }
  }

  /**
   * Set multiple values at once
   */
  public async setMultiple<T>(
    data: Record<string, T>,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const pairs: [string, string][] = [];

      for (const [key, value] of Object.entries(data)) {
        const fullKey = this.getFullKey(key);
        let processedValue = JSON.stringify(value);

        if (options.encrypt) {
          processedValue = this.encrypt(processedValue);
        }

        if (options.compress) {
          processedValue = this.compress(processedValue);
        }

        pairs.push([fullKey, processedValue]);

        // Update cache
        this.updateCache(key, value, options.expiry);
      }

      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error("Storage setMultiple error:", error);
      throw new Error("Failed to store multiple values");
    }
  }

  /**
   * Clear all app data
   */
  public async clear(): Promise<void> {
    try {
      const keys = await this.getKeys();
      const fullKeys = keys.map((key) => this.getFullKey(key));

      if (fullKeys.length > 0) {
        await AsyncStorage.multiRemove(fullKeys);
      }

      this.cache.clear();
      this.cacheHits = 0;
      this.cacheMisses = 0;
    } catch (error) {
      console.error("Storage clear error:", error);
      throw new Error("Failed to clear storage");
    }
  }

  /**
   * Get storage usage statistics
   */
  public async getStats(): Promise<StorageStats> {
    try {
      const keys = await this.getKeys();
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      let oldestEntry: string | null = null;
      let newestEntry: string | null = null;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(this.getFullKey(key));
        if (value) {
          totalSize += value.length;

          // Try to extract timestamp if it's a cache entry
          try {
            const parsed = JSON.parse(value);
            if (this.isCacheEntry(parsed)) {
              const timestamp = parsed.timestamp;
              if (timestamp < oldestTimestamp) {
                oldestTimestamp = timestamp;
                oldestEntry = key;
              }
              if (timestamp > newestTimestamp) {
                newestTimestamp = timestamp;
                newestEntry = key;
              }
            }
          } catch {
            // Not a cache entry, ignore
          }
        }
      }

      const cacheHitRate =
        this.cacheHits + this.cacheMisses > 0
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0;

      return {
        totalKeys: keys.length,
        totalSize,
        cacheHitRate,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error("Storage getStats error:", error);
      return {
        totalKeys: 0,
        totalSize: 0,
        cacheHitRate: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Clean up expired entries
   */
  public async cleanup(): Promise<number> {
    try {
      const keys = await this.getKeys();
      let removedCount = 0;

      for (const key of keys) {
        const value = await this.get(key);
        if (value === null) {
          // Entry was expired and removed during get()
          removedCount++;
        }
      }

      // Clean up memory cache
      this.cleanupMemoryCache();

      return removedCount;
    } catch (error) {
      console.error("Storage cleanup error:", error);
      return 0;
    }
  }

  /**
   * User data helpers
   */
  public async setUserData<T>(
    userId: string,
    key: string,
    value: T
  ): Promise<void> {
    await this.set(
      `${StorageService.PREFIXES.USER_DATA}${userId}_${key}`,
      value
    );
  }

  public async getUserData<T>(userId: string, key: string): Promise<T | null> {
    return await this.get(
      `${StorageService.PREFIXES.USER_DATA}${userId}_${key}`
    );
  }

  public async removeUserData(userId: string, key: string): Promise<void> {
    await this.remove(`${StorageService.PREFIXES.USER_DATA}${userId}_${key}`);
  }

  /**
   * App settings helpers
   */
  public async setSetting<T>(key: string, value: T): Promise<void> {
    await this.set(`${StorageService.PREFIXES.SETTINGS}${key}`, value);
  }

  public async getSetting<T>(key: string, defaultValue?: T): Promise<T | null> {
    return await this.get(
      `${StorageService.PREFIXES.SETTINGS}${key}`,
      defaultValue
    );
  }

  /**
   * Temporary data helpers (auto-expire)
   */
  public async setTemp<T>(
    key: string,
    value: T,
    expiry: number = 60 * 60 * 1000
  ): Promise<void> {
    await this.set(`${StorageService.PREFIXES.TEMP}${key}`, value, { expiry });
  }

  public async getTemp<T>(key: string): Promise<T | null> {
    return await this.get(`${StorageService.PREFIXES.TEMP}${key}`);
  }

  /**
   * Secure data helpers (encrypted)
   */
  public async setSecure<T>(key: string, value: T): Promise<void> {
    await this.set(`${StorageService.PREFIXES.SECURE}${key}`, value, {
      encrypt: true,
    });
  }

  public async getSecure<T>(key: string): Promise<T | null> {
    return await this.get(`${StorageService.PREFIXES.SECURE}${key}`);
  }

  // Private helper methods

  private getAppPrefix(): string {
    return "sav3_app_";
  }

  private getFullKey(key: string): string {
    return `${this.getAppPrefix()}${key}`;
  }

  private removeAppPrefix(fullKey: string): string {
    return fullKey.replace(this.getAppPrefix(), "");
  }

  private updateCache<T>(key: string, value: T, expiry?: number): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCacheEntry();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiry,
    });
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiry
    if (entry.expiry && Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private evictOldestCacheEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.expiry && now - entry.timestamp > entry.expiry) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.cache.delete(key));
  }

  private isCacheEntry(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      "data" in data &&
      "timestamp" in data &&
      typeof data.timestamp === "number"
    );
  }

  private async parseStoredValue<T>(storedValue: string): Promise<T | null> {
    try {
      let processedData = storedValue;

      // Try to decompress
      try {
        processedData = this.decompress(processedData);
      } catch {
        // Not compressed
      }

      // Try to decrypt
      try {
        processedData = this.decrypt(processedData);
      } catch {
        // Not encrypted
      }

      const parsed = JSON.parse(processedData);

      if (this.isCacheEntry(parsed)) {
        const entry = parsed as CacheEntry<T>;

        // Check expiry
        if (entry.expiry && Date.now() - entry.timestamp > entry.expiry) {
          return null;
        }

        return entry.data;
      }

      return parsed;
    } catch (error) {
      console.error("Parse stored value error:", error);
      return null;
    }
  }

  // Placeholder encryption/compression methods
  // In a real implementation, these would use proper crypto libraries
  private encrypt(data: string): string {
    // Placeholder: In production, use proper encryption
    return `encrypted_${btoa(data)}`;
  }

  private decrypt(data: string): string {
    // Placeholder: In production, use proper decryption
    if (data.startsWith("encrypted_")) {
      return atob(data.replace("encrypted_", ""));
    }
    throw new Error("Not encrypted");
  }

  private compress(data: string): string {
    // Placeholder: In production, use proper compression
    return `compressed_${data}`;
  }

  private decompress(data: string): string {
    // Placeholder: In production, use proper decompression
    if (data.startsWith("compressed_")) {
      return data.replace("compressed_", "");
    }
    throw new Error("Not compressed");
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
