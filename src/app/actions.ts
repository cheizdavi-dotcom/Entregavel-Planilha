'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const transactionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(100),
  category: z.string().min(1),
});

export async function addTransactionAction(formData: FormData) {
  if (!db) {
    return {
      errors: { _server: ['A conexão com o banco de dados não foi estabelecida.'] },
    };
  }
  
  const values = {
    userId: formData.get('userId'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    category: formData.get('category'),
  };

  const validatedFields = transactionSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await addDoc(collection(db, 'users', validatedFields.data.userId, 'transactions'), {
      type: validatedFields.data.type,
      amount: validatedFields.data.amount,
      description: validatedFields.data.description,
      category: validatedFields.data.category,
      date: new Date().toISOString(),
    });

    revalidatePath('/');
    return {
      message: 'Transaction added successfully.',
    };
  } catch (e: any) {
    console.error("Firebase Add Transaction Error: ", e);
    return {
      errors: { _server: [e.message || 'Falha ao adicionar transação. Verifique as regras do Firestore ou sua conexão.'] },
    };
  }
}


const goalSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(50),
  totalValue: z.coerce.number().positive(),
  currentValue: z.coerce.number().min(0),
});

export async function addGoalAction(formData: FormData) {
  if (!db) {
    return {
      errors: { _server: ['A conexão com o banco de dados não foi estabelecida.'] },
    };
  }

  const values = {
    userId: formData.get('userId'),
    name: formData.get('name'),
    totalValue: formData.get('totalValue'),
    currentValue: formData.get('currentValue'),
  };

  const validatedFields = goalSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await addDoc(collection(db, 'users', validatedFields.data.userId, 'goals'), validatedFields.data);
    revalidatePath('/');
    return { message: 'Goal added successfully.' };
  } catch (e: any) {
    console.error("Firebase Add Goal Error: ", e);
    return {
      errors: { _server: [e.message || 'Falha ao adicionar meta.'] },
    };
  }
}
