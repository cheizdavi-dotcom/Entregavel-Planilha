'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface SummaryCardsProps {
  balance: number;
  income: number;
  expenses: number;
  loading: boolean;
}

const SummaryCard = ({ title, value, icon, variant = 'default', loading }: { title: string, value: number, icon: React.ReactNode, variant?: 'default' | 'primary' | 'destructive', loading: boolean }) => {
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


    return (
        <Card className="glass-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={iconColor}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>{formatCurrency(value)}</div>
                 <p className="text-xs text-muted-foreground">{title} no período</p>
            </CardContent>
        </Card>
    );
};


export default function SummaryCards({ balance, income, expenses, loading }: SummaryCardsProps) {
  return (
    <>
      <SummaryCard 
        title="Saldo Atual"
        value={balance}
        icon={<Wallet className="h-4 w-4" />}
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
