'use client';

import * as React from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/types';

import AuthGuard from '@/components/auth-guard';
import Header from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import ExpenseChart from '@/components/dashboard/expense-chart';
import MonthlyOverviewChart from '@/components/dashboard/monthly-overview-chart';
import TransactionList from '@/components/dashboard/transaction-list';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          userTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(userTransactions);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const { balance, income, expenses } = React.useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expenses += t.amount;
        }
        acc.balance = acc.income - acc.expenses;
        return acc;
      },
      { balance: 0, income: 0, expenses: 0 }
    );
  }, [transactions]);

  const MainContent = () => (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <Header />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCards balance={balance} income={income} expenses={expenses} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <MonthlyOverviewChart transactions={transactions} />
        </div>
        <div className="lg:col-span-3">
          <ExpenseChart transactions={transactions} />
        </div>
      </div>
      <TransactionList transactions={transactions.slice(0, 5)} />
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[126px] rounded-lg" />
        <Skeleton className="h-[126px] rounded-lg" />
        <Skeleton className="h-[126px] rounded-lg" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-[350px] lg:col-span-4 rounded-lg" />
        <Skeleton className="h-[350px] lg:col-span-3 rounded-lg" />
      </div>
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );


  return (
    <AuthGuard>
      <div className="relative flex min-h-screen w-full flex-col bg-background">
        <main className="flex-1">
          {loading ? <LoadingSkeleton /> : <MainContent />}
        </main>
        <AddTransactionDialog />
      </div>
    </AuthGuard>
  );
}
