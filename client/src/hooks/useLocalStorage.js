import { useState } from 'react';

// Hàm phụ: đọc dữ liệu ban đầu từ localStorage
const readFromStorage = (key, initialValue) => {
  try {
    const savedText = localStorage.getItem(key);

    if (savedText !== null) {
      return JSON.parse(savedText);
    }
    if (typeof initialValue === 'function') {
      return initialValue();
    }
    return initialValue;
  } catch (error) {
    console.warn('Không thể đọc dữ liệu từ localStorage:', error);
    return initialValue;
  }
};

// Custom hook đồng bộ state React với localStorage
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    return readFromStorage(key, initialValue);
  });

  // Hàm cập nhật cả state React lẫn localStorage
  const setValue = (newValue) => {
    try {
      let valueToSave = newValue;

      if (typeof newValue === 'function') {
        valueToSave = newValue(storedValue);
      }

      setStoredValue(valueToSave);
      localStorage.setItem(key, JSON.stringify(valueToSave));
    } catch (error) {
      console.warn('Không thể lưu dữ liệu vào localStorage:', error);
    }
  };

  // Hàm xóa dữ liệu khỏi localStorage và đưa state về giá trị mặc định
  const removeValue = () => {
    try {
      localStorage.removeItem(key);

      if (typeof initialValue === 'function') {
        setStoredValue(initialValue());
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn('Không thể xóa dữ liệu trong localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;