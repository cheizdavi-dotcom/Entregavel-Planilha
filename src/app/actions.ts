'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid'; // Precisaremos de UUIDs para os IDs locais

// NOTA: Como estamos usando localStorage, as 'actions' não vão realmente interagir
// com um servidor. Elas apenas validam e retornam os dados para que o cliente
// possa salvá-los no localStorage. Esta é uma adaptação do padrão.
// O ideal seria que o cliente fizesse tudo, mas vamos manter a estrutura
// para minimizar as mudanças no lado do cliente.

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
  
  const date = new Date(validatedFields.data.date);
  if (isNaN(date.getTime())) {
    return { errors: { date: ['Data inválida.'] } };
  }

  const newTransaction = {
    id: uuidv4(),
    ...validatedFields.data,
    date: date.toISOString(),
  };

  // Em vez de salvar no DB, retornamos o objeto para o cliente salvar.
  revalidatePath('/');
  return {
    message: 'Transação validada com sucesso.',
    data: newTransaction
  };
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
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const newGoal = {
    id: uuidv4(),
    ...validatedFields.data,
  };

  revalidatePath('/');
  return { message: 'Meta validada com sucesso.', data: newGoal };
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
    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, goalId, currentValue, totalValue } = validatedFields.data;

    if (currentValue > totalValue) {
        return { errors: { currentValue: ['O valor guardado não pode ser maior que o valor total da meta.'] } };
    }
    
    revalidatePath('/');
    return { message: 'Meta atualizada com sucesso.', data: { id: goalId, currentValue } };
}


const deleteGoalSchema = z.object({
    userId: z.string().min(1),
    goalId: z.string().min(1),
});

export async function deleteGoalAction(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        goalId: formData.get('goalId'),
    };

    const validatedFields = deleteGoalSchema.safeParse(values);
    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    revalidatePath('/');
    return { message: 'Meta excluída com sucesso.', data: { id: validatedFields.data.goalId } };
}

const debtSchema = z.object({
  userId: z.string().min(1),
  creditorName: z.string().min(1, 'O nome do credor é obrigatório.').max(50),
  totalValue: z.coerce.number().positive('O valor total deve ser positivo.'),
  paidValue: z.coerce.number().min(0, 'O valor pago não pode ser negativo.'),
  interestRate: z.coerce.number().min(0, 'A taxa de juros não pode ser negativa.'),
  dueDate: z.coerce.number().int().min(1).max(31, 'O dia do vencimento deve ser entre 1 e 31.'),
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
    interestRate: String(formData.get('interestRate')),
    dueDate: String(formData.get('dueDate')),
  };

  const validatedFields = debtSchema.safeParse({
    ...values,
    totalValue: parseFloat(values.totalValue),
    paidValue: parseFloat(values.paidValue),
    interestRate: parseFloat(values.interestRate),
    dueDate: parseInt(values.dueDate, 10),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const newDebt = {
    id: uuidv4(),
    ...validatedFields.data,
  };
  
  revalidatePath('/dividas');
  return { message: 'Dívida validada com sucesso.', data: newDebt };
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

    const { debtId, paidValue, totalValue } = validatedFields.data;
    if (paidValue > totalValue) return { errors: { paidValue: ['O valor pago não pode ser maior que o valor total.'] } };

    revalidatePath('/dividas');
    return { message: 'Dívida atualizada com sucesso.', data: { id: debtId, paidValue } };
}

const deleteDebtSchema = z.object({
    userId: z.string().min(1),
    debtId: z.string().min(1),
});

export async function deleteDebtAction(formData: FormData) {
    const values = { userId: formData.get('userId'), debtId: formData.get('debtId') };
    const validatedFields = deleteDebtSchema.safeParse(values);
    if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
    
    revalidatePath('/dividas');
    return { message: 'Dívida excluída com sucesso.', data: { id: validatedFields.data.debtId } };
}
