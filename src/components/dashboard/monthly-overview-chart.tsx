'use client';

import * as React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
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
    const dailyData: { [key: string]: { date: string; income: number; expense: number } } = {};
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    transactions.forEach((t) => {
       const transactionDate = new Date(t.date);
       if (transactionDate < firstDayOfMonth) return; // Only this month's data

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

    return Object.values(dailyData).sort((a,b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
    });
  }, [transactions]);

  return (
    <Card className="glass-dark h-full">
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
        <CardDescription>Receitas vs. Despesas neste mês</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Sem dados para exibir o gráfico do mês.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
