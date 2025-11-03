import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Cache, CacheManager } from '../cache';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>({
      maxSize: 3,
      ttl: 1000,
      enableStats: true,
    });
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should return cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when maxSize reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it recently used
      cache.get('key1');

      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should not evict when updating existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1 (not adding new entry)
      cache.set('key1', 'updated');

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe('updated');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not return expired entries with has()', async () => {
      cache.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.has('key1')).toBe(false);
    });

    it('should cleanup expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const cleaned = cache.cleanup();
      expect(cleaned).toBe(2);
      expect(cache.size()).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track cache hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    it('should track cache misses', () => {
      cache.get('nonexistent');
      cache.get('missing');

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should track sets', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.sets).toBe(2);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // triggers eviction

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('should reset statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1');

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('memoization', () => {
    it('should memoize async functions', async () => {
      let callCount = 0;
      const asyncFn = async (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = cache.memoize(asyncFn);

      const result1 = await memoized(5);
      const result2 = await memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(callCount).toBe(1); // Function only called once
    });

    it('should memoize with custom key generator', async () => {
      let callCount = 0;
      const asyncFn = async (obj: { id: number }) => {
        callCount++;
        return obj.id * 2;
      };

      const memoized = cache.memoize(asyncFn, (obj) => `obj-${obj.id}`);

      await memoized({ id: 5 });
      await memoized({ id: 5 });

      expect(callCount).toBe(1);
    });

    it('should memoize sync functions', () => {
      let callCount = 0;
      const syncFn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = cache.memoizeSync(syncFn);

      const result1 = memoized(5);
      const result2 = memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(callCount).toBe(1);
    });
  });
});

describe('CacheManager', () => {
  beforeEach(() => {
    CacheManager.reset();
  });

  describe('cache management', () => {
    it('should create and retrieve cache instances', () => {
      const cache1 = CacheManager.getCache('test1');
      const cache2 = CacheManager.getCache('test1');

      expect(cache1).toBe(cache2); // Same instance
    });

    it('should create separate caches for different names', () => {
      const cache1 = CacheManager.getCache('test1');
      const cache2 = CacheManager.getCache('test2');

      expect(cache1).not.toBe(cache2);
    });

    it('should create cache with options', () => {
      const cache = CacheManager.getCache('test', {
        maxSize: 10,
        ttl: 5000,
        enableStats: true,
      });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should clear all caches', () => {
      const cache1 = CacheManager.getCache('test1');
      const cache2 = CacheManager.getCache('test2');

      cache1.set('key1', 'value1');
      cache2.set('key2', 'value2');

      CacheManager.clearAll();

      expect(cache1.size()).toBe(0);
      expect(cache2.size()).toBe(0);
    });

    it('should cleanup all caches', async () => {
      const cache1 = CacheManager.getCache('test1', { ttl: 500 });
      const cache2 = CacheManager.getCache('test2', { ttl: 500 });

      cache1.set('key1', 'value1');
      cache2.set('key2', 'value2');

      await new Promise((resolve) => setTimeout(resolve, 600));

      const cleaned = CacheManager.cleanupAll();
      expect(cleaned).toBe(2);
    });

    it('should get statistics for all caches', () => {
      const cache1 = CacheManager.getCache('test1', { enableStats: true });
      const cache2 = CacheManager.getCache('test2', { enableStats: true });

      cache1.set('key1', 'value1');
      cache1.get('key1');
      cache2.set('key2', 'value2');
      cache2.get('missing');

      const stats = CacheManager.getAllStats();

      expect(stats['test1']).toBeDefined();
      expect(stats['test1'].hits).toBe(1);
      expect(stats['test2']).toBeDefined();
      expect(stats['test2'].misses).toBe(1);
    });

    it('should reset statistics for all caches', () => {
      const cache1 = CacheManager.getCache('test1', { enableStats: true });
      const cache2 = CacheManager.getCache('test2', { enableStats: true });

      cache1.set('key1', 'value1');
      cache1.get('key1');
      cache2.set('key2', 'value2');

      CacheManager.resetAllStats();

      const stats = CacheManager.getAllStats();
      expect(stats['test1'].hits).toBe(0);
      expect(stats['test2'].sets).toBe(0);
    });
  });
});
