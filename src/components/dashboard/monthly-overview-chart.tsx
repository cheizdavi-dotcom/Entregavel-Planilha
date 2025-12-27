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
import { getDaysInMonth, format } from 'date-fns';

interface MonthlyOverviewChartProps {
  transactions: Transaction[];
  loading: boolean;
  currentDate: Date;
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
        <p className="font-semibold">Nenhuma transação neste mês</p>
        <p className="text-sm">Adicione uma transação para ver a evolução do seu fluxo de caixa.</p>
    </div>
);

export default function MonthlyOverviewChart({ transactions, loading, currentDate }: MonthlyOverviewChartProps) {
  const data = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
            date: format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'dd/MM'),
            income: 0,
            expense: 0,
        };
    });

    transactions.forEach((t) => {
       const transactionDate = new Date(t.date);
       const dayOfMonth = transactionDate.getUTCDate() - 1;

       if(dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
            if (t.type === 'income') {
                dailyData[dayOfMonth].income += t.amount;
            } else {
                dailyData[dayOfMonth].expense += t.amount;
            }
       }
    });

    return dailyData;
  }, [transactions, currentDate]);

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

  const hasData = transactions.length > 0;

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
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart 
                accessibilityLayer 
                data={data} 
                margin={{ top: 5, right: 10, bottom: 0, left: 10 }}
            >
                <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="transparent" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                        const day = parseInt(value.substring(0, 2));
                        if (day % 5 === 0 || day === 1 || day === data.length) {
                            return value.substring(0, 2);
                        }
                        return '';
                    }}
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
                content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => {
                    if (name === 'income') return [<span className="font-inter font-bold">{formatCurrency(Number(value))}</span>, "Receita"];
                    if (name === 'expense') return [<span className="font-inter font-bold">{formatCurrency(Number(value))}</span>, "Despesa"];
                    return [value, name];
                }}/>}
              />
              <Area dataKey="income" type="monotone" fill="url(#fillIncome)" stroke="#00ff88" strokeWidth={3} dot={false} />
              <Area dataKey="expense" type="monotone" fill="url(#fillExpense)" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
