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

/**
 * Custom hook đồng bộ state React với window.localStorage.
 * Hỗ trợ lazy initializer, functional update và đồng bộ giữa các tab trình duyệt.
 *
 * @template T
 * @param {string} key - Tên key lưu trong localStorage
 * @param {T | (() => T)} initialValue - Giá trị mặc định ban đầu
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void]}
 */
export const useLocalStorage = (key, initialValue) => {
  const initialValueRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState(() =>
    readStorageValue(key, initialValue)
  );
  const storedValueRef = useRef(storedValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  // Đọc lại dữ liệu nếu key thay đổi
  useEffect(() => {
    const nextValue = readStorageValue(key, initialValueRef.current);
    storedValueRef.current = nextValue;
    setStoredValue(nextValue);
  }, [key]);

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          typeof value === 'function' ? value(storedValueRef.current) : value;

        storedValueRef.current = valueToStore;
        setStoredValue(valueToStore);

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

      storedValueRef.current = fallback;
      setStoredValue(fallback);
    } catch (error) {
      console.warn(`useLocalStorage: không thể xóa key "${key}"`, error);
    }
  }, [key]);

  // Đồng bộ khi localStorage thay đổi từ tab khác (có cleanup)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorageChange = (event) => {
      if (event.key !== key) return;
      const syncedValue = readStorageValue(key, initialValueRef.current);
      storedValueRef.current = syncedValue;
      setStoredValue(syncedValue);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;