'use client';

import { useEffect, useState } from 'react';

/**
 * useState that persists to localStorage. The stored value is applied after mount
 * (so server and first client render match), and every change is written back.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch (error) {
      console.error(`Failed to read localStorage key "${key}"`, error);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to write localStorage key "${key}"`, error);
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
