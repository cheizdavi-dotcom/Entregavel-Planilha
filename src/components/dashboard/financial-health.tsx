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
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinancialHealthProps {
  transactions: Transaction[];
  totalIncome: number;
  loading: boolean;
}

const ruleConfig = {
    needs: { label: 'Essencial', targetPercentage: 50, color: 'bg-primary' },
    wants: { label: 'Estilo de Vida', targetPercentage: 30, color: 'bg-secondary' },
    savings: { label: 'Investimentos', targetPercentage: 20, color: 'bg-chart-3' },
};

const SkeletonLoader = () => (
    <div className="space-y-6">
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-4 w-40 mt-1" />
        </div>
        <div className='space-y-2'>
            <div className='flex justify-between items-baseline'>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
             <Skeleton className="h-4 w-44 mt-1" />
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
  
  const ProgressBar = ({ label, spent, targetPercentage }: { label: string, spent: number, targetPercentage: number }) => {
    const targetValue = totalIncome * (targetPercentage / 100);
    const percentage = targetValue > 0 ? (spent / targetValue) * 100 : spent > 0 ? 101 : 0; // Se a meta for 0 mas houver gasto, estoura.
    const remaining = targetValue - spent;

    let feedbackText, feedbackColor, feedbackIcon;
    const isOver = remaining < 0;

    let indicatorColor;

    if (isOver) {
      feedbackText = `ALERTA: Você excedeu ${formatCurrency(Math.abs(remaining))}.`;
      feedbackColor = 'text-destructive';
      feedbackIcon = <AlertCircle className="h-3.5 w-3.5" />;
      indicatorColor = 'bg-destructive';
    } else if (percentage >= 80) {
      feedbackText = `Atenção! Restam apenas ${formatCurrency(remaining)}.`;
      feedbackColor = 'text-yellow-400';
      feedbackIcon = <AlertTriangle className="h-3.5 w-3.5" />;
      indicatorColor = 'bg-yellow-400';
    } else {
      feedbackText = `Ótimo! Ainda restam ${formatCurrency(remaining)} para gastar.`;
      feedbackColor = 'text-primary';
      feedbackIcon = <CheckCircle className="h-3.5 w-3.5" />;
      indicatorColor = ruleConfig[label.toLowerCase() as keyof typeof ruleConfig]?.color || 'bg-primary';
    }
     // Caso especial: se não há renda, a meta é 0. Qualquer gasto estoura.
    if(totalIncome <= 0 && spent > 0) {
        feedbackText = `Você gastou ${formatCurrency(spent)} sem ter renda declarada.`;
        feedbackColor = 'text-destructive';
        feedbackIcon = <AlertCircle className="h-3.5 w-3.5" />;
        indicatorColor = 'bg-destructive';
    }


    return (
        <div className='space-y-1.5'>
            <div className='flex justify-between items-baseline'>
                <p className='text-sm font-medium'>{label}</p>
                <p className={`text-xs font-semibold font-inter`}>
                    {formatCurrency(spent)}
                    <span className='ml-2 text-muted-foreground'>/ {formatCurrency(targetValue)}</span>
                </p>
            </div>
            <Progress value={Math.min(percentage, 100)} indicatorClassName={indicatorColor} className="h-3 rounded-full" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${feedbackColor}`}>
                {feedbackIcon}
                <span>{feedbackText}</span>
            </div>
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
        {!hasIncome && transactions.length === 0 ? (
            <EmptyState />
        ) : (
          <div className="space-y-6">
            <ProgressBar 
                label={ruleConfig.needs.label}
                spent={needs}
                targetPercentage={ruleConfig.needs.targetPercentage}
            />
             <ProgressBar 
                label={ruleConfig.wants.label}
                spent={wants}
                targetPercentage={ruleConfig.wants.targetPercentage}
            />
             <ProgressBar 
                label={ruleConfig.savings.label}
                spent={savings}
                targetPercentage={ruleConfig.savings.targetPercentage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}