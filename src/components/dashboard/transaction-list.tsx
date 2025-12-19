'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { categoriesConfig } from '@/lib/categories';
import { Skeleton } from '../ui/skeleton';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const Icon = categoriesConfig[category]?.icon;
    return Icon ? <Icon className={className} /> : null;
};

const SkeletonRow = () => (
    <TableRow>
        <TableCell className="py-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className='flex flex-col gap-1'>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell className="text-right">
            <Skeleton className="h-5 w-20 ml-auto" />
        </TableCell>
    </TableRow>
);

const EmptyState = () => (
    <TableRow>
        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
            Ainda não há transações. Adicione a primeira!
        </TableCell>
    </TableRow>
);


export default function TransactionList({ transactions, loading }: TransactionListProps) {
  const hasTransactions = transactions.length > 0;
  return (
    <Card className="glass-dark">
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
        <CardDescription>Suas movimentações mais recentes.</CardDescription>
      </CardHeader>
      <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </>
              ) : hasTransactions ? (
                transactions.map((t) => (
                    <TableRow key={t.id}>
                    <TableCell className='py-4'>
                        <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                                {t.type === 'income' ? (
                                    <ArrowUp className="h-4 w-4 text-primary" />
                                ) : (
                                    <ArrowDown className="h-4 w-4 text-destructive" />
                                )}
                            </div>
                            <div className='flex flex-col'>
                                <span className="font-medium text-base">{t.description}</span>
                                <span className="text-sm text-muted-foreground md:hidden">{t.category}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="flex w-fit items-center gap-1.5 py-1 px-2">
                            <CategoryIcon category={t.category} className="h-3.5 w-3.5" />
                            {t.category}
                        </Badge>
                    </TableCell>
                    <TableCell
                        className={`text-right font-semibold text-base ${
                        t.type === 'income' ? 'text-primary' : 'text-foreground'
                        }`}
                    >
                        {t.type === 'expense' && '- '}{formatCurrency(t.amount)}
                        <div className='text-xs font-normal text-muted-foreground'>
                            {new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <EmptyState />
              )}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}
