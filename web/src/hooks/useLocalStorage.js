import { useState, useEffect, useCallback } from 'react';

/**
 * Enhanced useLocalStorage hook with:
 * - Type-safe storage and retrieval
 * - Automatic JSON serialization
 * - Cross-tab synchronization
 * - Error handling and validation
 * - TTL (Time To Live) support
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const { ttl = null, validate = null } = options;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);

      // Check TTL
      if (ttl && parsed.expiresAt && Date.now() > parsed.expiresAt) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      // Validate if validator provided
      if (validate && !validate(parsed.value)) {
        return initialValue;
      }

      return parsed.value || initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Set value with optional TTL
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Validate before storing
      if (validate && !validate(valueToStore)) {
        console.warn(`Validation failed for localStorage key "${key}"`);
        return;
      }

      setStoredValue(valueToStore);

      // Store with TTL if specified
      const storageValue = ttl
        ? JSON.stringify({
            value: valueToStore,
            expiresAt: Date.now() + ttl,
          })
        : JSON.stringify({ value: valueToStore });

      window.localStorage.setItem(key, storageValue);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, ttl, validate]);

  // Remove value
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        if (!e.newValue) {
          setStoredValue(initialValue);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setStoredValue(parsed.value || initialValue);
          } catch (error) {
            console.error(`Error syncing localStorage key "${key}":`, error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};
