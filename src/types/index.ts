import { User as FirebaseUser } from 'firebase/auth';

export type Transaction = {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
};

export type User = Pick<FirebaseUser, 'uid' | 'email' | 'displayName' | 'photoURL'>;

export type Goal = {
    id: string;
    userId: string;
    name: string;
    currentValue: number;
    totalValue: number;
};
