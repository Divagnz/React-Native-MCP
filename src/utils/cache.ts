/**
 * Cache utility for improving performance across MCP server operations
 * Implements LRU (Least Recently Used) cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  /**
   * Maximum number of entries in cache
   * @default 100
   */
  maxSize?: number;

  /**
   * Time to live in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;

  /**
   * Enable cache statistics tracking
   * @default false
   */
  enableStats?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
  hitRate: number;
}

/**
 * LRU Cache with TTL support
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;
  private enableStats: boolean;

  // Statistics
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private evictions = 0;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 300000; // 5 minutes default
    this.enableStats = options.enableStats ?? false;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.enableStats) {
        this.misses++;
      }
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.misses++;
        this.evictions++;
      }
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableStats) {
      this.hits++;
    }
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    });

    if (this.enableStats) {
      this.sets++;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.evictions++;
      }
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    if (this.enableStats) {
      this.hits = 0;
      this.misses = 0;
      this.sets = 0;
      this.evictions = 0;
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      evictions: this.evictions,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.evictions = 0;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
        if (this.enableStats) {
          this.evictions++;
        }
      }
    }

    return cleaned;
  }

  /**
   * Memoize an async function
   */
  memoize<Args extends any[], Result>(
    fn: (...args: Args) => Promise<Result>,
    keyGenerator?: (...args: Args) => string
  ): (...args: Args) => Promise<Result> {
    return async (...args: Args): Promise<Result> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      const cached = this.get(key);
      if (cached !== undefined) {
        return cached as Result;
      }

      const result = await fn(...args);
      this.set(key, result as any);
      return result;
    };
  }

  /**
   * Memoize a sync function
   */
  memoizeSync<Args extends any[], Result>(
    fn: (...args: Args) => Result,
    keyGenerator?: (...args: Args) => string
  ): (...args: Args) => Result {
    return (...args: Args): Result => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      const cached = this.get(key);
      if (cached !== undefined) {
        return cached as Result;
      }

      const result = fn(...args);
      this.set(key, result as any);
      return result;
    };
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    let lowestAccessCount = Infinity;

    // Find least recently used entry (use access count as tie-breaker)
    for (const [key, entry] of this.cache.entries()) {
      if (
        entry.lastAccessed < oldestTime ||
        (entry.lastAccessed === oldestTime && entry.accessCount < lowestAccessCount)
      ) {
        oldestTime = entry.lastAccessed;
        lowestAccessCount = entry.accessCount;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.enableStats) {
        this.evictions++;
      }
    }
  }
}

/**
 * Global cache instances for different data types
 */
export class CacheManager {
  private static caches = new Map<string, Cache>();

  /**
   * Get or create a cache instance
   */
  static getCache<T = any>(name: string, options?: CacheOptions): Cache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Cache<T>(options));
    }
    return this.caches.get(name)!;
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Cleanup expired entries in all caches
   */
  static cleanupAll(): number {
    let total = 0;
    for (const cache of this.caches.values()) {
      total += cache.cleanup();
    }
    return total;
  }

  /**
   * Get statistics for all caches
   */
  static getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  /**
   * Reset statistics for all caches
   */
  static resetAllStats(): void {
    for (const cache of this.caches.values()) {
      cache.resetStats();
    }
  }

  /**
   * Reset cache manager - clear all cache instances
   * Useful for testing to ensure clean state
   */
  static reset(): void {
    this.caches.clear();
  }
}

// Create specialized cache instances
export const fileAnalysisCache = CacheManager.getCache('fileAnalysis', {
  maxSize: 50,
  ttl: 600000, // 10 minutes - files don't change often during analysis
  enableStats: true,
});

export const packageInfoCache = CacheManager.getCache('packageInfo', {
  maxSize: 100,
  ttl: 900000, // 15 minutes - package data is relatively stable
  enableStats: true,
});

export const componentAnalysisCache = CacheManager.getCache('componentAnalysis', {
  maxSize: 30,
  ttl: 300000, // 5 minutes - components may change frequently during dev
  enableStats: true,
});

export const dependencyTreeCache = CacheManager.getCache('dependencyTree', {
  maxSize: 20,
  ttl: 1800000, // 30 minutes - dependency trees are expensive to compute
  enableStats: true,
});

// Schedule periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    CacheManager.cleanupAll();
  }, 300000);
}
