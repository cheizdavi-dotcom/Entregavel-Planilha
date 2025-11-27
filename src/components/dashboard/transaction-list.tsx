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

interface TransactionListProps {
  transactions: Transaction[];
}

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
                    <Badge variant="outline">{t.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      t.type === 'income' ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Nenhuma transação encontrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
