'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction } from '@/types';
import { categoriesConfig } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface FinancialHealthProps {
  transactions: Transaction[];
  totalIncome: number;
  loading: boolean;
}

const ruleConfig = {
    needs: { label: 'Essencial', target: 50, color: 'bg-primary' },
    wants: { label: 'Estilo de Vida', target: 30, color: 'bg-secondary' },
    savings: { label: 'Investimentos', target: 20, color: 'bg-chart-3' },
};

const SkeletonLoader = () => (
    <div className="space-y-6">
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <p className="font-semibold">Adicione receitas e despesas</p>
        <p className="text-sm">Para ver sua saúde financeira e a regra 50/30/20.</p>
    </div>
);


export default function FinancialHealth({ transactions, totalIncome, loading }: FinancialHealthProps) {
  const [progressValues, setProgressValues] = React.useState({ needs: 0, wants: 0, savings: 0 });

  const { needs, wants, savings } = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    return expenses.reduce(
      (acc, t) => {
        const categoryType = categoriesConfig[t.category]?.type503020 || 'wants';
        acc[categoryType] += t.amount;
        return acc;
      },
      { needs: 0, wants: 0, savings: 0 }
    );
  }, [transactions]);
  
  const getPercentage = (value: number) => {
    return totalIncome > 0 ? (value / totalIncome) * 100 : 0;
  };

  const needsPercentage = getPercentage(needs);
  const wantsPercentage = getPercentage(wants);
  const savingsPercentage = getPercentage(savings);

  React.useEffect(() => {
    if (!loading) {
        const timer = setTimeout(() => {
            setProgressValues({
                needs: needsPercentage,
                wants: wantsPercentage,
                savings: savingsPercentage,
            });
        }, 300); // Small delay to start animation after render
        return () => clearTimeout(timer);
    } else {
        // Reset on loading
        setProgressValues({ needs: 0, wants: 0, savings: 0 });
    }
}, [loading, needsPercentage, wantsPercentage, savingsPercentage]);

  const ProgressBar = ({ label, percentage, target, color, value, animatedValue }: { label: string, percentage: number, target: number, color: string, value: number, animatedValue: number }) => {
    const isOver = percentage > target;
    return (
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <p className='text-sm font-medium'>{label}</p>
                <p className={`text-sm font-semibold ${isOver ? 'text-destructive' : 'text-foreground'}`}>
                    {formatCurrency(value)}
                    <span className='ml-2 text-xs text-muted-foreground'>({percentage.toFixed(0)}% de {target}%)</span>
                </p>
            </div>
            <Progress value={animatedValue} indicatorClassName={isOver ? 'bg-destructive' : color} className="h-3 rounded-full" />
        </div>
    );
  }
  
  if (loading) {
      return (
          <Card className="glass-dark h-full">
            <CardHeader>
                <CardTitle>Saúde Financeira</CardTitle>
                <CardDescription>Regra 50/30/20 baseada na renda</CardDescription>
            </CardHeader>
            <CardContent>
                <SkeletonLoader />
            </CardContent>
          </Card>
      )
  }

  const hasIncome = totalIncome > 0;

  return (
    <Card className="glass-dark h-full">
      <CardHeader>
        <CardTitle>Saúde Financeira</CardTitle>
        <CardDescription>Regra 50/30/20 baseada na renda</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasIncome ? (
            <EmptyState />
        ) : (
          <div className="space-y-6">
            <ProgressBar 
                label={ruleConfig.needs.label}
                percentage={needsPercentage}
                target={ruleConfig.needs.target}
                color={ruleConfig.needs.color}
                value={needs}
                animatedValue={progressValues.needs}
            />
             <ProgressBar 
                label={ruleConfig.wants.label}
                percentage={wantsPercentage}
                target={ruleConfig.wants.target}
                color={ruleConfig.wants.color}
                value={wants}
                animatedValue={progressValues.wants}
            />
             <ProgressBar 
                label={ruleConfig.savings.label}
                percentage={savingsPercentage}
                target={ruleConfig.savings.target}
                color={ruleConfig.savings.color}
                value={savings}
                animatedValue={progressValues.savings}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}