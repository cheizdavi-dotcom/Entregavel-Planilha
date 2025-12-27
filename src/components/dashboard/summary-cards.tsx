'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface SummaryCardsProps {
  balance: number;
  income: number;
  expenses: number;
  prevMonthSavings: number;
  loading: boolean;
}

const SummaryCard = ({ title, value, icon, variant = 'default', loading, comparison }: { title: string, value: number, icon: React.ReactNode, variant?: 'default' | 'primary' | 'destructive', loading: boolean, comparison?: number }) => {
    if (loading) {
        return (
            <Card className="glass-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-3 w-28 mt-2" />
                </CardContent>
            </Card>
        )
    }

    const valueColor = {
        default: 'text-foreground',
        primary: 'text-primary',
        destructive: 'text-destructive',
    }[variant];
    
    const iconColor = {
        default: 'text-muted-foreground',
        primary: 'text-primary',
        destructive: 'text-destructive',
    }[variant];
    
    const savings = value;
    const difference = comparison !== undefined ? savings - comparison : 0;
    const isPositive = difference >= 0;
    const comparisonText = comparison !== undefined ? 
        `Você economizou ${formatCurrency(Math.abs(difference))} ${isPositive ? 'a mais' : 'a menos'} que no mês passado` : 
        `${title} no período`;


    return (
        <Card className="glass-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={iconColor}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className={`font-inter text-2xl md:text-3xl font-bold tracking-tight ${valueColor}`}>{formatCurrency(value)}</div>
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {comparison !== undefined && (
                      isPositive ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-destructive" />
                    )}
                    {comparisonText}
                </p>
            </CardContent>
        </Card>
    );
};


export default function SummaryCards({ balance, income, expenses, loading, prevMonthSavings }: SummaryCardsProps) {
  return (
    <>
      <SummaryCard 
        title="Saldo do Mês"
        value={balance}
        icon={<Wallet className="h-4 w-4" />}
        comparison={prevMonthSavings}
        loading={loading}
      />
       <SummaryCard
        title="Total Receitas"
        value={income}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="primary"
        loading={loading}
      />
       <SummaryCard 
        title="Total Despesas"
        value={expenses}
        icon={<TrendingDown className="h-4 w-4" />}
        variant="destructive"
        loading={loading}
      />
    </>
  );
}