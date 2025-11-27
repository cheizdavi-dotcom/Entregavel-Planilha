'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/types';

interface ExpenseChartProps {
  transactions: Transaction[];
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const expenseData = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category,
        total,
        fill: chartColors[Math.floor(Math.random() * chartColors.length)], // Assign a semi-random color
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const chartConfig = React.useMemo(() => {
    return expenseData.reduce((acc, data) => {
      acc[data.category] = {
        label: data.category,
        color: data.fill,
      };
      return acc;
    }, {} as any);
  }, [expenseData]);

  return (
    <Card className="glass-dark h-full">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Um resumo das suas despesas</CardDescription>
      </CardHeader>
      <CardContent>
        {expenseData.length > 0 ? (
           <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[250px]"
          >
            <PieChart>
               <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={expenseData}
                dataKey="total"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Sem dados de despesas para exibir.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
