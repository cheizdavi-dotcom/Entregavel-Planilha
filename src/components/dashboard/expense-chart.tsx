'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/types';
import { categoriesConfig } from '@/lib/categories';
import { PartyPopper } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface ExpenseChartProps {
  transactions: Transaction[];
  loading: boolean;
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const ChartSkeleton = () => (
    <div className="flex items-center justify-center h-[180px]">
        <Skeleton className="h-[180px] w-[180px] rounded-full" />
    </div>
);

const EmptyState = () => (
  <div className="flex h-[180px] flex-col items-center justify-center text-center text-muted-foreground p-4">
    <PartyPopper className="h-10 w-10 mb-4 text-primary" />
    <p className="font-semibold">Sem despesas ainda!</p>
    <p className="text-sm">Adicione uma despesa para ver o gráfico de categorias.</p>
  </div>
);


export default function ExpenseChart({ transactions, loading }: ExpenseChartProps) {
  const expenseData = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return [];

    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals)
      .map(([category, total], index) => ({
        category,
        total,
        fill: chartColors[index % chartColors.length], 
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const chartConfig = React.useMemo(() => {
    return expenseData.reduce((acc, data) => {
      acc[data.category] = {
        label: data.category,
        color: data.fill,
        icon: categoriesConfig[data.category]?.icon
      };
      return acc;
    }, {} as any);
  }, [expenseData]);

  const totalExpenses = React.useMemo(() => {
    return expenseData.reduce((sum, item) => sum + item.total, 0);
  }, [expenseData]);

  if (loading) {
    return (
        <Card className="glass-dark h-full flex flex-col">
            <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
                <CardDescription>Distribuição de despesas</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <ChartSkeleton />
            </CardContent>
        </Card>
    )
  }

  const hasData = expenseData.length > 0;

  return (
    <Card className="glass-dark h-full flex flex-col">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Distribuição de despesas</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {!hasData ? (
          <EmptyState />
        ) : (
           <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[180px]"
          >
            <PieChart>
               <Tooltip 
                cursor={false} 
                content={
                  <ChartTooltipContent 
                    hideLabel 
                    formatter={(value) => `${(Number(value) / totalExpenses * 100).toFixed(0)}%`}
                  />
                } 
               />
              <Pie
                data={expenseData}
                dataKey="total"
                nameKey="category"
                innerRadius={60}
                outerRadius={80}
                strokeWidth={2}
                paddingAngle={5}
                cornerRadius={8}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
