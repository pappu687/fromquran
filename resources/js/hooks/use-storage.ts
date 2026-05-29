import { useEffect, useLayoutEffect, useState } from 'react';

interface UseStorageOptions<T> {
    key: string;
    defaultValue: T;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
}

export function useStorage<T>({
    key,
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
}: UseStorageOptions<T>) {
    const [value, setValue] = useState<T>(defaultValue);

    useLayoutEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setValue(deserialize(item));
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
    }, [key, deserialize]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(key, serialize(value));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, value, serialize]);

    return [value, setValue] as const;
}

// Specific hooks for common use cases
export function useLocalStorage<T>(key: string, defaultValue: T) {
    return useStorage({ key, defaultValue });
}

// Hook for SSR-safe localStorage with cookie fallback
export function useSSRStorage<T>({
    key,
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
}: UseStorageOptions<T>) {
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setValue(deserialize(item));
            } else {
                // Try to read from cookie (for SSR hydration)
                const cookies = document.cookie.split(';');
                const cookie = cookies.find((c) =>
                    c.trim().startsWith(`${key}=`),
                );
                if (cookie) {
                    const cookieValue = cookie.split('=')[1];
                    if (cookieValue) {
                        setValue(deserialize(decodeURIComponent(cookieValue)));
                    }
                }
            }
        } catch (error) {
            console.warn(`Error reading storage key "${key}":`, error);
        }
    }, [key, deserialize]);

    const setStoredValue = (newValue: T | ((prev: T) => T)) => {
        const valueToStore =
            newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);

        try {
            window.localStorage.setItem(key, serialize(valueToStore));
            // Also set as cookie for SSR
            document.cookie = `${key}=${encodeURIComponent(serialize(valueToStore))}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (error) {
            console.warn(`Error setting storage key "${key}":`, error);
        }
    };

    return [value, setStoredValue] as const;
}
