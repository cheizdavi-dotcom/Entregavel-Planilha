'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
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
import { LineChart } from 'lucide-react';

interface MonthlyOverviewChartProps {
  transactions: Transaction[];
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

export default function MonthlyOverviewChart({ transactions }: MonthlyOverviewChartProps) {
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

    // Se tivermos apenas um ponto de dado, duplicamos para formar uma linha
    if (sortedData.length === 1) {
      return [sortedData[0], { ...sortedData[0], date: ' ' }];
    }

    return sortedData;
  }, [transactions]);

  return (
    <Card className="glass-dark h-full flex flex-col">
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
        <CardDescription>Receitas vs. Despesas neste mês</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart 
                accessibilityLayer 
                data={data} 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 5)}
                />
                <YAxis
                    tickFormatter={(value) => formatCurrency(Number(value)).replace('R$', '')}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={80}
                />
              <Tooltip
                cursor={true}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area dataKey="income" type="natural" fill="url(#fillIncome)" stroke="var(--color-income)" stackId="1" />
              <Area dataKey="expense" type="natural" fill="url(#fillExpense)" stroke="var(--color-expense)" stackId="1" />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center text-center text-muted-foreground p-4">
            <LineChart className="h-10 w-10 mb-4 text-primary" />
            <p className="font-semibold">Adicione sua primeira transação!</p>
            <p className="text-sm">Comece a registrar seus ganhos e gastos para ver sua evolução.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
