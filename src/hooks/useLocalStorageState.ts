"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(key: string, onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === key) onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("kotoba:storage", handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("kotoba:storage", handleLocalChange);
  };
}

export function useLocalStorageState<T extends string>(
  key: string,
  fallback: T,
  allowedValues: readonly T[],
): [T, (value: T) => void] {
  const getSnapshot = useCallback((): T => {
    const value = localStorage.getItem(key);
    return allowedValues.includes(value as T) ? value as T : fallback;
  }, [allowedValues, fallback, key]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const subscribeToKey = useCallback(
    (onChange: () => void) => subscribe(key, onChange),
    [key],
  );
  const value = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);

  const setValue = useCallback((nextValue: T) => {
    try {
      localStorage.setItem(key, nextValue);
      window.dispatchEvent(
        new CustomEvent("kotoba:storage", { detail: { key } }),
      );
    } catch (error) {
      console.error(`Failed to save "${key}" in local storage:`, error);
    }
  }, [key]);

  return [value, setValue];
}
