'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

// Hook para gerenciar dados no localStorage, separados por usuário
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const { user } = useAuth();

  // Gera uma chave única para o usuário
  const userKey = user ? `${key}-${user.uid}` : key;

  // State para guardar nosso valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // useEffect para atualizar o localStorage quando storedValue ou userKey muda
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(userKey, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.log(error);
    }
  }, [userKey, storedValue]);

  // useEffect para carregar os dados quando o usuário muda
  useEffect(() => {
     if (typeof window !== 'undefined') {
        try {
            const item = window.localStorage.getItem(userKey);
            setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
            console.log(error);
            setStoredValue(initialValue);
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);


  return [storedValue, setStoredValue];
}
