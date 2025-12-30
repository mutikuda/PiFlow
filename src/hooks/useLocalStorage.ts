import { useState, useEffect } from 'react';

/**
 * LocalStorageと同期するuseStateフック
 * @param key LocalStorageのキー
 * @param initialValue 初期値
 * @returns [value, setValue] タプル
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // LocalStorageから値を読み込む
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // 値を更新する関数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 関数の場合は現在の値を渡して実行
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // state を更新
      setStoredValue(valueToStore);

      // LocalStorage に保存
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // 他のタブでの変更を検知
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage event for ${key}:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
