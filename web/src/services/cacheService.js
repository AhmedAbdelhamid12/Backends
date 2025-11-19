/**
 * Frontend Redis Cache Service
 * Manages local caching strategy with IndexedDB for persistent storage
 * and in-memory cache for immediate access
 */

const CACHE_STORES = {
  USERS: 'users',
  SESSIONS: 'sessions',
  SUBSCRIPTIONS: 'subscriptions',
  TEAMS: 'teams',
  PROGRESS: 'progress',
  ACHIEVEMENTS: 'achievements',
  DASHBOARD: 'dashboard'
};

const DEFAULT_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 1 * 60 * 60 * 1000,  // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
};

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.ttlTimers = new Map();
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, using memory cache only');
        this.dbReady = false;
        resolve();
        return;
      }

      const request = indexedDB.open('SwimAcademyCache', 1);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed');
        this.dbReady = false;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.dbReady = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        for (const storeName of Object.values(CACHE_STORES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' });
          }
        }
      };
    });
  }

  /**
   * Get item from cache (memory first, then IndexedDB)
   */
  async get(key, storeName = 'default') {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (cached.expiresAt > Date.now()) {
        return cached.value;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check IndexedDB if available
    if (this.dbReady) {
      try {
        const value = await this.getFromIndexedDB(key, storeName);
        if (value) {
          // Restore to memory cache
          this.memoryCache.set(key, value);
          return value.value;
        }
      } catch (error) {
        console.warn('IndexedDB read error:', error);
      }
    }

    return null;
  }

  /**
   * Set item in cache with TTL
   */
  async set(key, value, ttl = DEFAULT_TTL.MEDIUM, storeName = 'default') {
    const expiresAt = Date.now() + ttl;
    const cacheEntry = { key, value, expiresAt, timestamp: Date.now() };

    // Set in memory cache
    this.memoryCache.set(key, cacheEntry);

    // Clear existing timer
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
    }

    // Set auto-expiry timer
    const timer = setTimeout(() => {
      this.memoryCache.delete(key);
      this.ttlTimers.delete(key);
    }, ttl);
    this.ttlTimers.set(key, timer);

    // Set in IndexedDB if available
    if (this.dbReady) {
      try {
        await this.setToIndexedDB(cacheEntry, storeName);
      } catch (error) {
        console.warn('IndexedDB write error:', error);
      }
    }
  }

  /**
   * Delete item from cache
   */
  async delete(key, storeName = 'default') {
    this.memoryCache.delete(key);
    
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }

    if (this.dbReady) {
      try {
        await this.deleteFromIndexedDB(key, storeName);
      } catch (error) {
        console.warn('IndexedDB delete error:', error);
      }
    }
  }

  /**
   * Clear all cache in a specific store
   */
  async clear(storeName = 'default') {
    // Clear memory
    for (const [key] of this.memoryCache) {
      if (this.ttlTimers.has(key)) {
        clearTimeout(this.ttlTimers.get(key));
      }
    }
    this.memoryCache.clear();
    this.ttlTimers.clear();

    // Clear IndexedDB
    if (this.dbReady) {
      try {
        await this.clearIndexedDB(storeName);
      } catch (error) {
        console.warn('IndexedDB clear error:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      memorySizeKB: (new Blob([...this.memoryCache.entries()].toString()).size / 1024).toFixed(2),
      activeTimers: this.ttlTimers.size,
      indexedDBReady: this.dbReady
    };
  }

  // ==================== IndexedDB Helpers ====================

  getFromIndexedDB(key, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiresAt > Date.now()) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  setToIndexedDB(cacheEntry, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  deleteFromIndexedDB(key, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  clearIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Specialized cache managers
class UserCacheManager {
  static async get(userId) {
    return cache.get(`user:${userId}`, CACHE_STORES.USERS);
  }

  static async set(userId, data) {
    return cache.set(`user:${userId}`, data, DEFAULT_TTL.LONG, CACHE_STORES.USERS);
  }

  static async delete(userId) {
    return cache.delete(`user:${userId}`, CACHE_STORES.USERS);
  }

  static async invalidate(userId) {
    await cache.delete(`user:${userId}`, CACHE_STORES.USERS);
  }
}

class SessionCacheManager {
  static async get(sessionId) {
    return cache.get(`session:${sessionId}`, CACHE_STORES.SESSIONS);
  }

  static async set(sessionId, data) {
    return cache.set(`session:${sessionId}`, data, DEFAULT_TTL.MEDIUM, CACHE_STORES.SESSIONS);
  }

  static async delete(sessionId) {
    return cache.delete(`session:${sessionId}`, CACHE_STORES.SESSIONS);
  }
}

class DashboardCacheManager {
  static async get(userId) {
    return cache.get(`dashboard:${userId}`, CACHE_STORES.DASHBOARD);
  }

  static async set(userId, data) {
    return cache.set(`dashboard:${userId}`, data, DEFAULT_TTL.SHORT, CACHE_STORES.DASHBOARD);
  }

  static async invalidate(userId) {
    await cache.delete(`dashboard:${userId}`, CACHE_STORES.DASHBOARD);
  }
}

// Create global cache instance
const cache = new CacheService();

export default cache;
export {
  CacheService,
  UserCacheManager,
  SessionCacheManager,
  DashboardCacheManager,
  DEFAULT_TTL,
  CACHE_STORES
};
