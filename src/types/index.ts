export type Transaction = {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
};

export type User = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};