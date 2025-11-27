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
    needs: { label: 'Essencial', target: 50, color: 'bg-blue-500' },
    wants: { label: 'Estilo de Vida', target: 30, color: 'bg-purple-500' },
    savings: { label: 'Investimentos', target: 20, color: 'bg-green-500' },
};

const SkeletonLoader = () => (
    <div className="space-y-6">
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full" />
        </div>
    </div>
);

export default function FinancialHealth({ transactions, totalIncome, loading }: FinancialHealthProps) {
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

  const ProgressBar = ({ label, percentage, target, color, value }: { label: string, percentage: number, target: number, color: string, value: number }) => {
    const isOver = percentage > target;
    return (
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <p className='text-sm font-medium'>{label}</p>
                <p className={`text-sm font-semibold ${isOver ? 'text-red-500' : 'text-foreground'}`}>
                    {formatCurrency(value)}
                    <span className='ml-2 text-xs text-muted-foreground'>({percentage.toFixed(0)}% de {target}%)</span>
                </p>
            </div>
            <Progress value={percentage} indicatorClassName={isOver ? 'bg-red-500' : color} className="h-2"/>
        </div>
    );
  }

  const hasIncome = totalIncome > 0;

  return (
    <Card className="glass-dark h-full">
      <CardHeader>
        <CardTitle>Saúde Financeira</CardTitle>
        <CardDescription>Regra 50/30/20 baseada na renda</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !hasIncome ? (
            <SkeletonLoader />
        ) : (
          <div className="space-y-6">
            <ProgressBar 
                label={ruleConfig.needs.label}
                percentage={needsPercentage}
                target={ruleConfig.needs.target}
                color={ruleConfig.needs.color}
                value={needs}
            />
             <ProgressBar 
                label={ruleConfig.wants.label}
                percentage={wantsPercentage}
                target={ruleConfig.wants.target}
                color={ruleConfig.wants.color}
                value={wants}
            />
             <ProgressBar 
                label={ruleConfig.savings.label}
                percentage={savingsPercentage}
                target={ruleConfig.savings.target}
                color={ruleConfig.savings.color}
                value={savings}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
