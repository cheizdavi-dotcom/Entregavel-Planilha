'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const transactionSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  description: z.string().min(1, 'A descrição é obrigatória.').max(100),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  date: z.string().min(1, 'A data é obrigatória.'),
  paymentMethod: z.string().min(1, 'O tipo de pagamento é obrigatório.'),
  installments: z.coerce.number().optional(),
});

export async function addTransactionAction(formData: FormData) {
  const values = {
    userId: formData.get('userId'),
    type: formData.get('type'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    category: formData.get('category'),
    date: formData.get('date'),
    paymentMethod: formData.get('paymentMethod'),
    installments: formData.get('installments'),
  };

  const validatedFields = transactionSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!db) {
    return { errors: { _server: ['O banco de dados não está configurado.'] } };
  }
  
  const date = new Date(validatedFields.data.date);
  if (isNaN(date.getTime())) {
    return { errors: { date: ['Data inválida.'] } };
  }

  try {
    const docRef = await addDoc(collection(db, `users/${validatedFields.data.userId}/transactions`), {
      ...validatedFields.data,
      date: date.toISOString(),
      createdAt: serverTimestamp(),
    });
    revalidatePath('/');
    return { message: 'Transação adicionada com sucesso.', data: { id: docRef.id, ...validatedFields.data } };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { errors: { _server: ['Não foi possível adicionar a transação.'] } };
  }
}

const goalSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, 'O nome é obrigatório.').max(50),
  totalValue: z.coerce.number().positive('O valor total deve ser positivo.'),
  currentValue: z.coerce.number().min(0, 'O valor atual não pode ser negativo.'),
});

export async function addGoalAction(formData: FormData) {
  const values = {
    userId: formData.get('userId'),
    name: formData.get('name'),
    totalValue: formData.get('totalValue'),
    currentValue: formData.get('currentValue'),
  };

  const validatedFields = goalSchema.safeParse(values);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  
  if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };

  try {
    const docRef = await addDoc(collection(db, `users/${validatedFields.data.userId}/goals`), validatedFields.data);
    revalidatePath('/');
    return { message: 'Meta adicionada com sucesso.', data: { id: docRef.id, ...validatedFields.data } };
  } catch (error) {
    console.error("Error adding goal:", error);
    return { errors: { _server: ['Não foi possível adicionar a meta.'] } };
  }
}

const updateGoalSchema = z.object({
    userId: z.string().min(1),
    goalId: z.string().min(1),
    currentValue: z.coerce.number().min(0, "O valor guardado não pode ser negativo."),
    totalValue: z.coerce.number().positive('O valor total deve ser positivo.'),
});

export async function updateGoalAction(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        goalId: formData.get('goalId'),
        currentValue: formData.get('currentValue'),
        totalValue: formData.get('totalValue'),
    };

    const validatedFields = updateGoalSchema.safeParse(values);
    if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
    if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };

    const { userId, goalId, currentValue, totalValue } = validatedFields.data;
    if (currentValue > totalValue) return { errors: { currentValue: ['O valor guardado não pode ser maior que o valor total da meta.'] } };
    
    try {
      const goalRef = doc(db, `users/${userId}/goals`, goalId);
      await updateDoc(goalRef, { currentValue });
      revalidatePath('/');
      return { message: 'Meta atualizada com sucesso.', data: { id: goalId, currentValue } };
    } catch (error) {
      console.error("Error updating goal:", error);
      return { errors: { _server: ['Não foi possível atualizar a meta.'] } };
    }
}

const deleteGoalSchema = z.object({
    userId: z.string().min(1),
    goalId: z.string().min(1),
});

export async function deleteGoalAction(formData: FormData) {
    const values = { userId: formData.get('userId'), goalId: formData.get('goalId') };
    const validatedFields = deleteGoalSchema.safeParse(values);
    if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
    if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };
    
    const { userId, goalId } = validatedFields.data;
    try {
      const goalRef = doc(db, `users/${userId}/goals`, goalId);
      await deleteDoc(goalRef);
      revalidatePath('/');
      return { message: 'Meta excluída com sucesso.', data: { id: goalId } };
    } catch (error) {
      console.error("Error deleting goal:", error);
      return { errors: { _server: ['Não foi possível excluir a meta.'] } };
    }
}

const debtSchema = z.object({
  userId: z.string().min(1),
  creditorName: z.string().min(1, 'O nome do credor é obrigatório.').max(50),
  totalValue: z.coerce.number().positive('O valor total deve ser positivo.'),
  paidValue: z.coerce.number().min(0, 'O valor pago não pode ser negativo.'),
}).refine(data => data.paidValue <= data.totalValue, {
  message: "O valor pago não pode ser maior que o valor total da dívida.",
  path: ["paidValue"],
});

export async function addDebtAction(formData: FormData) {
  const values = {
    userId: String(formData.get('userId')),
    creditorName: String(formData.get('creditorName')),
    totalValue: String(formData.get('totalValue')),
    paidValue: String(formData.get('paidValue')),
  };

  const validatedFields = debtSchema.safeParse({
    ...values,
    totalValue: parseFloat(values.totalValue),
    paidValue: parseFloat(values.paidValue),
  });

  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
  if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };
  
  try {
    const docRef = await addDoc(collection(db, `users/${validatedFields.data.userId}/debts`), validatedFields.data);
    revalidatePath('/dividas');
    return { message: 'Dívida adicionada com sucesso.', data: { id: docRef.id, ...validatedFields.data } };
  } catch (error) {
    console.error("Error adding debt:", error);
    return { errors: { _server: ['Não foi possível adicionar a dívida.'] } };
  }
}

const updateDebtSchema = z.object({
    userId: z.string().min(1),
    debtId: z.string().min(1),
    paidValue: z.coerce.number().min(0, "O valor pago não pode ser negativo."),
    totalValue: z.coerce.number().positive('O valor total deve ser positivo.'),
});

export async function updateDebtAction(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        debtId: formData.get('debtId'),
        paidValue: formData.get('paidValue'),
        totalValue: formData.get('totalValue'),
    };

    const validatedFields = updateDebtSchema.safeParse(values);
    if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
    if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };

    const { userId, debtId, paidValue, totalValue } = validatedFields.data;
    if (paidValue > totalValue) return { errors: { paidValue: ['O valor pago não pode ser maior que o valor total.'] } };

    try {
      const debtRef = doc(db, `users/${userId}/debts`, debtId);
      await updateDoc(debtRef, { paidValue });
      revalidatePath('/dividas');
      return { message: 'Dívida atualizada com sucesso.', data: { id: debtId, paidValue } };
    } catch (error) {
      console.error("Error updating debt:", error);
      return { errors: { _server: ['Não foi possível atualizar a dívida.'] } };
    }
}

const deleteDebtSchema = z.object({
    userId: z.string().min(1),
    debtId: z.string().min(1),
});

export async function deleteDebtAction(formData: FormData) {
    const values = { userId: formData.get('userId'), debtId: formData.get('debtId') };
    const validatedFields = deleteDebtSchema.safeParse(values);
    if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
    if (!db) return { errors: { _server: ['O banco de dados não está configurado.'] } };
    
    const { userId, debtId } = validatedFields.data;

    try {
        const debtRef = doc(db, `users/${userId}/debts`, debtId);
        await deleteDoc(debtRef);
        revalidatePath('/dividas');
        return { message: 'Dívida excluída com sucesso.', data: { id: debtId } };
    } catch (error) {
        console.error("Error deleting debt:", error);
        return { errors: { _server: ['Não foi possível excluir a dívida.'] } };
    }
}
