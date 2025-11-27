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
    // Correção: Salva na subcoleção de transações do usuário.
    await addDoc(collection(db, 'users', validatedFields.data.userId, 'transactions'), {
      type: validatedFields.data.type,
      amount: validatedFields.data.amount,
      description: validatedFields.data.description,
      category: validatedFields.data.category,
      date: new Date().toISOString(),
    });

    // Se a operação for bem-sucedida, revalida o cache e retorna sucesso.
    revalidatePath('/');
    return {
      message: 'Transaction added successfully.',
    };
  } catch (e: any) {
    // Se ocorrer qualquer erro durante o addDoc (regras de segurança, problemas de rede, etc.)
    // o erro será capturado aqui.
    console.error("Firebase Add Transaction Error: ", e);
    return {
      errors: { _server: [e.message || 'Falha ao adicionar transação. Verifique as regras do Firestore ou sua conexão.'] },
    };
  }
}
