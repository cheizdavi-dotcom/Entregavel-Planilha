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
import { ArrowUpCircle, ArrowDownCircle, ShoppingBasket } from 'lucide-react';
import { categoriesConfig } from '@/lib/categories';

interface TransactionListProps {
  transactions: Transaction[];
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const Icon = categoriesConfig[category]?.icon;
    return Icon ? <Icon className={className} /> : null;
};


export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <Card className="glass-dark">
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
        <CardDescription>Suas movimentações mais recentes.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
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
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {t.type === 'income' ? (
                            <ArrowUpCircle className="h-5 w-5 text-primary" />
                        ) : (
                            <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">{t.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                        <CategoryIcon category={t.category} className="h-3 w-3" />
                        {t.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col text-center py-10 items-center justify-center text-muted-foreground">
            <ShoppingBasket className="h-10 w-10 mb-4 text-primary" />
            <p className="font-semibold">Nenhuma transação encontrada.</p>
            <p className='text-sm'>Adicione um gasto ou ganho para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
