import { useCallback } from 'react';
import cache, { DEFAULT_TTL } from '../services/cacheService';

/**
 * Custom hook for cache management
 * Provides easy access to cache operations throughout the app
 */
function useCache() {
  const getCached = useCallback(async (key, storeName = 'default') => {
    return cache.get(key, storeName);
  }, []);

  const setCached = useCallback(async (key, value, ttl = DEFAULT_TTL.MEDIUM, storeName = 'default') => {
    return cache.set(key, value, ttl, storeName);
  }, []);

  const deleteCached = useCallback(async (key, storeName = 'default') => {
    return cache.delete(key, storeName);
  }, []);

  const clearCache = useCallback(async (storeName = 'default') => {
    return cache.clear(storeName);
  }, []);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, []);

  return {
    getCached,
    setCached,
    deleteCached,
    clearCache,
    getStats
  };
}

export default useCache;
