'use server';
/**
 * @fileOverview An AI flow for categorizing financial transactions.
 *
 * - categorizeTransactions - A function that handles the transaction categorization process.
 * - CategorizeTransactionsInput - The input type for the categorizeTransactions function.
 * - CategorizeTransactionsOutput - The return type for the categorizeTransactions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { categoriesConfig } from '@/lib/categories';

const TransactionToCategorizeSchema = z.object({
  description: z.string().describe('The transaction description, like "UBER TRIP" or "SUPERMERCADO XYZ".'),
  amount: z.number().describe('The transaction amount.'),
  type: z.enum(['income', 'expense']).describe('The type of the transaction.'),
});

const CategorizedTransactionSchema = TransactionToCategorizeSchema.extend({
  category: z.string().describe('The suggested category for the transaction.'),
});

export const CategorizeTransactionsInputSchema = z.object({
  transactions: z.array(TransactionToCategorizeSchema),
});
export type CategorizeTransactionsInput = z.infer<typeof CategorizeTransactionsInputSchema>;

export const CategorizeTransactionsOutputSchema = z.object({
  categorizedTransactions: z.array(CategorizedTransactionSchema),
});
export type CategorizeTransactionsOutput = z.infer<typeof CategorizeTransactionsOutputSchema>;

export async function categorizeTransactions(input: CategorizeTransactionsInput): Promise<CategorizeTransactionsOutput> {
  return categorizeTransactionsFlow(input);
}

const getAvailableCategories = () => {
  const expenseCategories = Object.values(categoriesConfig)
    .filter(c => c.type === 'expense')
    .map(c => c.label);
  const incomeCategories = Object.values(categoriesConfig)
    .filter(c => c.type === 'income')
    .map(c => c.label);
  return { expenseCategories, incomeCategories };
};

const { expenseCategories, incomeCategories } = getAvailableCategories();

const prompt = ai.definePrompt({
  name: 'categorizeTransactionsPrompt',
  input: { schema: CategorizeTransactionsInputSchema },
  output: { schema: CategorizeTransactionsOutputSchema },
  prompt: `You are an expert financial assistant. Your task is to categorize a list of transactions based on their description.

Here are the available categories:
- For expenses: ${expenseCategories.join(', ')}
- For income: ${incomeCategories.join(', ')}

Analyze each transaction in the list below. Based on its description, assign the most logical category from the lists above.
If the description is unclear, use your best judgment. For generic store names, 'Compras' is a good default. For income without a clear source, use 'Outras Receitas'.

You MUST return ONLY a valid JSON object matching the requested schema. Do not use Markdown or any other formatting.

Transactions to categorize:
{{{json transactions}}}
`,
});

const categorizeTransactionsFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionsFlow',
    inputSchema: CategorizeTransactionsInputSchema,
    outputSchema: CategorizeTransactionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the categorization AI.');
    }
    return output;
  }
);
