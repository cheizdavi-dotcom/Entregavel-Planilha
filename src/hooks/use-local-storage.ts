'use client';

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Efeito para carregar o valor inicial do localStorage quando a chave muda e é válida
    useEffect(() => {
        if (typeof window === 'undefined' || !key) {
            // Se não estiver no navegador ou a chave for nula/inválida, não faça nada.
            // E reseta para o valor inicial para evitar mostrar dados de um usuário anterior.
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
    }, [key, initialValue]);


    const setValue = (value: T | ((val: T) => T)) => {
        if (typeof window === 'undefined' || !key) {
            // Se a chave for inválida, não tente salvar.
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
    }, [key, initialValue]);


    return [storedValue, setValue];
}

export default useLocalStorage;
