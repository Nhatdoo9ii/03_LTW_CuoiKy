import { useState, useEffect, useCallback, useRef } from 'react';

const readStorageValue = (key, initialValue) => {
  const fallback =
    typeof initialValue === 'function' ? initialValue() : initialValue;

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawItem = window.localStorage.getItem(key);
    return rawItem !== null ? JSON.parse(rawItem) : fallback;
  } catch (error) {
    console.warn(`useLocalStorage: không thể đọc key "${key}"`, error);
    return fallback;
  }
};

export const useLocalStorage = (key, initialValue) => {
  const initialValueRef = useRef(initialValue);

  const [state, setState] = useState(() => ({
    key,
    value: readStorageValue(key, initialValue),
  }));

  const currentValue =
    state.key === key ? state.value : readStorageValue(key, initialValue);

  const currentValueRef = useRef(currentValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          typeof value === 'function' ? value(currentValueRef.current) : value;

        currentValueRef.current = valueToStore;
        setState({ key, value: valueToStore });

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`useLocalStorage: không thể ghi key "${key}"`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      const fallback =
        typeof initialValueRef.current === 'function'
          ? initialValueRef.current()
          : initialValueRef.current;

      currentValueRef.current = fallback;
      setState({ key, value: fallback });
    } catch (error) {
      console.warn(`useLocalStorage: không thể xóa key "${key}"`, error);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorageChange = (event) => {
      if (event.key !== key) return;
      const syncedValue = readStorageValue(key, initialValueRef.current);
      currentValueRef.current = syncedValue;
      setState({ key, value: syncedValue });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [currentValue, setValue, removeValue];
};

export default useLocalStorage;