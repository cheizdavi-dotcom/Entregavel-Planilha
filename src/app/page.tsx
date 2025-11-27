'use client';

import * as React from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
import FinancialHealth from '@/components/dashboard/financial-health';

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      if (!db) {
        console.error("Conexão com o Firestore não estabelecida.");
        setLoading(false);
        return;
      }
      
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          userTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(userTransactions);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } else {
        setLoading(false);
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
    <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 pb-[120px]">
      <Header />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCards balance={balance} income={income} expenses={expenses} loading={loading}/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4">
            <MonthlyOverviewChart transactions={transactions} loading={loading} />
        </div>
        
        <div className="lg:col-span-3 flex flex-col gap-6">
            <FinancialHealth transactions={transactions} totalIncome={income} loading={loading} />
            <ExpenseChart transactions={transactions} loading={loading} />
        </div>
      </div>
      
      <div className="relative z-10">
        <TransactionList transactions={transactions} loading={loading} />
      </div>
    </div>
  );


  return (
    <AuthGuard>
      <div className="relative flex min-h-screen w-full flex-col bg-background">
        <main className="flex-1">
          <MainContent />
        </main>
        <AddTransactionDialog />
      </div>
    </AuthGuard>
  );
}
