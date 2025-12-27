'use client';

import { User as FirebaseUser } from 'firebase/auth';

export type Transaction = {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO String
  paymentMethod: 'Dinheiro' | 'Pix' | 'Cartão de Crédito';
  installments?: number;
};

export type User = Pick<FirebaseUser, 'uid' | 'email' | 'displayName' | 'photoURL'>;

export type Goal = {
    id: string;
    userId: string;
    name: string;
    currentValue: number;
    totalValue: number;
};

export type Debt = {
    id: string;
    userId: string;
    creditorName: string;
    totalValue: number;
    paidValue: number;
    interestRate: number;
    dueDate: number; 
};

export type ParsedTransaction = {
  date: string; // ISO String
  description: string;
  amount: number;
  type: 'income' | 'expense';
};
