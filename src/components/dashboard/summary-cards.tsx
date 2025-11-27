'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export default function SummaryCards({ balance, income, expenses }: SummaryCardsProps) {
  return (
    <>
      <Card className="glass-dark">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Saldo Atual</CardTitle>
          <Wallet className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <p className="text-xs text-gray-400">Seu balanço financeiro</p>
        </CardContent>
      </Card>
      <Card className="glass-dark">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Total Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(income)}</div>
          <p className="text-xs text-gray-400">Receitas do período</p>
        </CardContent>
      </Card>
      <Card className="glass-dark">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Total Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(expenses)}</div>
          <p className="text-xs text-gray-400">Despesas do período</p>
        </CardContent>
      </Card>
    </>
  );
}
