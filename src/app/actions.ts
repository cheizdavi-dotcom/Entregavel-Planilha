'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const transactionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1).max(100),
  category: z.string().min(1),
});

export async function addTransactionAction(formData: FormData) {
  const values = {
    userId: formData.get('userId'),
    type: formData.get('type'),
    amount: Number(formData.get('amount')),
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
    await addDoc(collection(db, 'transactions'), {
      ...validatedFields.data,
      date: new Date().toISOString(),
    });

    revalidatePath('/');

    return {
      message: 'Transaction added successfully.',
    };
  } catch (e) {
    return {
      errors: { _server: ['Failed to add transaction.'] },
    };
  }
}
