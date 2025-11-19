import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

/**
 * Enhanced useFetch hook with:
 * - Configurable retry logic
 * - Request debouncing
 * - Caching
 * - Better error handling
 * - Abort controller support
 */
export const useFetch = (url, options = {}) => {
  const {
    skip = false,
    retries = 3,
    retryDelay = 1000,
    cache = true,
    debounceMs = 0,
    method = 'GET',
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef({});
  const debounceTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  // Get cached data
  const getCachedData = useCallback(() => {
    if (cache && cacheRef.current[url]) {
      return cacheRef.current[url];
    }
    return null;
  }, [url, cache]);

  // Set cached data
  const setCachedData = useCallback((data) => {
    if (cache) {
      cacheRef.current[url] = data;
    }
  }, [url, cache]);

  // Fetch data with retry logic
  const fetchData = useCallback(async () => {
    if (skip) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();
      const config = {
        ...options,
        signal: abortControllerRef.current.signal,
      };

      const response = await API[method.toLowerCase()](url, config);
      const responseData = response.data?.data || response.data;

      setData(responseData);
      setCachedData(responseData);
      retryCountRef.current = 0;
    } catch (err) {
      // Don't handle abort errors
      if (err.name === 'AbortError') return;

      const errorMessage = err.message || err.response?.data?.message || 'Failed to fetch data';

      // Retry logic
      if (retryCountRef.current < retries) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current); // Exponential backoff
        return;
      }

      setError(errorMessage);
      console.error(`Failed to fetch ${url}:`, errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, skip, retries, retryDelay, getCachedData, setCachedData, options, method]);

  // Debounced fetch
  useEffect(() => {
    if (debounceMs > 0) {
      debounceTimerRef.current = setTimeout(() => {
        fetchData();
      }, debounceMs);
      return () => clearTimeout(debounceTimerRef.current);
    } else {
      fetchData();
    }
  }, [fetchData, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Refetch function
  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Retry function
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
    isEmpty: !data || (Array.isArray(data) && data.length === 0),
  };
};
