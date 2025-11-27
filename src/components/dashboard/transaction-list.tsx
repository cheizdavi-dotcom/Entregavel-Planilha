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
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
        <TableCell>
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
            </div>
        </TableCell>
        <TableCell>
            <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
            <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell className="text-right">
            <Skeleton className="h-5 w-20 ml-auto" />
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
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !hasTransactions ? (
                <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </>
              ) : (
                transactions.map((t) => (
                    <TableRow key={t.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            {t.type === 'income' ? (
                                <ArrowUpCircle className="h-5 w-5 text-primary" />
                            ) : (
                                <ArrowDownCircle className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">{t.description}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex w-fit items-center gap-1.5 py-1 px-2">
                            <CategoryIcon category={t.category} className="h-3.5 w-3.5" />
                            {t.category}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                    </TableCell>
                    <TableCell
                        className={`text-right font-semibold ${
                        t.type === 'income' ? 'text-primary' : 'text-destructive'
                        }`}
                    >
                        {t.type === 'expense' && '- '}{formatCurrency(t.amount)}
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}
