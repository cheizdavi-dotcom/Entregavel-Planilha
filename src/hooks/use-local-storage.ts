'use client';

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        // Inicializa o valor lendo do localStorage apenas uma vez, no lado do cliente.
        if (typeof window === 'undefined' || !key) {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    // Efeito para atualizar o estado quando a chave (key) muda (ex: login/logout)
    useEffect(() => {
        if (typeof window === 'undefined' || !key) {
            setStoredValue(initialValue);
            return;
        }
        try {
            const item = window.localStorage.getItem(key);
            setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
            console.error(error);
            setStoredValue(initialValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);


    const setValue = (value: T | ((val: T) => T)) => {
        if (typeof window === 'undefined' || !key) {
            console.error("Tentativa de salvar no localStorage com chave inválida:", key);
            return;
        }
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    // Efeito para ouvir mudanças no storage de outras abas
    useEffect(() => {
        if (typeof window !== 'undefined' && key) {
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === key) {
                    try {
                        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                    } catch (error) {
                        console.error(error);
                    }
                }
            };
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);


    return [storedValue, setValue];
}

export default useLocalStorage;
