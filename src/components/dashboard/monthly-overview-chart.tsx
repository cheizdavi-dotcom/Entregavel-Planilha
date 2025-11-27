'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';


interface MonthlyOverviewChartProps {
  transactions: Transaction[];
  loading: boolean;
}

const chartConfig = {
  income: {
    label: 'Receita',
    color: 'hsl(var(--chart-1))',
  },
  expense: {
    label: 'Despesa',
    color: 'hsl(var(--chart-2))',
  },
};

const ChartSkeleton = () => (
    <div className="h-[280px] w-full p-6">
        <Skeleton className="h-full w-full" />
    </div>
);

const EmptyState = () => (
    <div className="flex h-[280px] w-full flex-col items-center justify-center text-center text-muted-foreground p-4">
        <p className="font-semibold">Adicione sua primeira transação</p>
        <p className="text-sm">E veja a evolução do seu fluxo de caixa neste mês.</p>
    </div>
);

export default function MonthlyOverviewChart({ transactions, loading }: MonthlyOverviewChartProps) {
  const data = React.useMemo(() => {
    if (transactions.length === 0) return [];
    
    const dailyData: { [key: string]: { date: string; income: number; expense: number } } = {};
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    transactions.forEach((t) => {
       const transactionDate = new Date(t.date);
       if (transactionDate < firstDayOfMonth) return; 

        const day = transactionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!dailyData[day]) {
            dailyData[day] = { date: day, income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            dailyData[day].income += t.amount;
        } else {
            dailyData[day].expense += t.amount;
        }
    });

    const sortedData = Object.values(dailyData).sort((a,b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
    });

    // If we have only one data point, we duplicate it to form a line.
    if (sortedData.length === 1) {
      return [sortedData[0], { ...sortedData[0], date: ' ' }];
    }

    return sortedData;
  }, [transactions]);

  if (loading) {
      return (
        <Card className="glass-dark h-full flex flex-col">
            <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Receitas vs. Despesas neste mês</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pl-2 pr-6">
                <ChartSkeleton />
            </CardContent>
        </Card>
      )
  }

  const hasData = data.length > 0;

  return (
    <Card className="glass-dark h-full flex flex-col">
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
        <CardDescription>Receitas vs. Despesas neste mês</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pl-2 pr-6">
        {!hasData ? (
          <EmptyState />
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart 
                accessibilityLayer 
                data={data} 
                margin={{ top: 5, right: 10, bottom: 0, left: 10 }}
            >
                <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 5)}
                    style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                    tickFormatter={(value) => formatCurrency(Number(value)).replace('R$ ', 'R$')}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={70}
                    style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
              <Tooltip
                cursor={true}
                content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))}/>}
              />
              <Area dataKey="income" type="monotone" fill="url(#fillIncome)" stroke="var(--color-income)" stackId="1" strokeWidth={2} />
              <Area dataKey="expense" type="monotone" fill="url(#fillExpense)" stroke="var(--color-expense)" stackId="1" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
