'use client';

import * as React from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction, Goal } from '@/types';
import { startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns';

import AuthGuard from '@/components/auth-guard';
import Header from '@/components/dashboard/header';
import SummaryCards from '@/components/dashboard/summary-cards';
import ExpenseChart from '@/components/dashboard/expense-chart';
import MonthlyOverviewChart from '@/components/dashboard/monthly-overview-chart';
import TransactionList from '@/components/dashboard/transaction-list';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import FinancialHealth from '@/components/dashboard/financial-health';
import { Skeleton } from '@/components/ui/skeleton';
import GoalsCard from '@/components/dashboard/goals-card';
import { AddGoalDialog } from '@/components/dashboard/add-goal-dialog';
import { UpdateGoalDialog } from '@/components/dashboard/update-goal-dialog';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';


const DashboardSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 pt-12 md:pt-0">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-8 w-20" />
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[102px] rounded-lg" />
                <Skeleton className="h-[102px] rounded-lg" />
                <Skeleton className="h-[102px] rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                <Skeleton className="h-[350px] lg:col-span-4 rounded-lg" />
                <div className="lg:col-span-3 flex flex-col gap-6">
                  <Skeleton className="h-[240px] rounded-lg" />
                  <Skeleton className="h-[280px] rounded-lg" />
                </div>
            </div>
            <Skeleton className="h-[300px] rounded-lg" />
        </div>
  </div>
);


export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [prevMonthTransactions, setPrevMonthTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // State for dialogs
  const [isAddTransactionOpen, setAddTransactionOpen] = React.useState(false);
  const [isAddGoalOpen, setAddGoalOpen] = React.useState(false);
  const [isUpdateGoalOpen, setUpdateGoalOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);

  const dialogInitialDate = isSameMonth(currentDate, new Date()) ? new Date() : startOfMonth(currentDate);

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setUpdateGoalOpen(true);
  };

  React.useEffect(() => {
    if (user?.uid) {
      if (!db) {
        console.error("Conexão com o Firestore não estabelecida.");
        setLoading(false);
        return;
      }
      
      setLoading(true);

      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(currentDate);
      
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('date', '>=', firstDay.toISOString()),
        where('date', '<=', lastDay.toISOString()),
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

      // Fetch previous month's transactions for comparison
      const prevMonth = subMonths(currentDate, 1);
      const prevMonthFirstDay = startOfMonth(prevMonth);
      const prevMonthLastDay = endOfMonth(prevMonth);

      const pq = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('date', '>=', prevMonthFirstDay.toISOString()),
        where('date', '<=', prevMonthLastDay.toISOString())
      );

      const unsubscribePrev = onSnapshot(pq, (querySnapshot) => {
        const prevTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          prevTransactions.push(doc.data() as Transaction);
        });
        setPrevMonthTransactions(prevTransactions);
      });
      
      return () => {
        unsubscribe();
        unsubscribePrev();
      };
    } else if (!user) {
        setLoading(false);
    }
  }, [user, currentDate]);

  const { balance, income, expenses } = React.useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount) || 0;
        if (t.type === 'income') {
          acc.income += amount;
        } else {
          acc.expenses += amount;
        }
        acc.balance = acc.income - acc.expenses;
        return acc;
      },
      { balance: 0, income: 0, expenses: 0 }
    );
  }, [transactions]);

  const prevMonthSavings = React.useMemo(() => {
    const { income, expenses } = prevMonthTransactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount) || 0;
        if (t.type === 'income') acc.income += amount;
        else acc.expenses += amount;
        return acc;
      }, { income: 0, expenses: 0 }
    );
    return income - expenses;
  }, [prevMonthTransactions]);

  const MainContent = () => (
    <div className="flex flex-col gap-6 p-4 md:p-8 pt-28 md:pt-8">
      <Header currentDate={currentDate} setCurrentDate={setCurrentDate} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCards balance={balance} income={income} expenses={expenses} prevMonthSavings={prevMonthSavings} loading={loading}/>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <MonthlyOverviewChart transactions={transactions} loading={loading} currentDate={currentDate} />
        </div>
        
        <div className="flex flex-col gap-6 lg:col-span-3">
            <FinancialHealth transactions={transactions} totalIncome={income} loading={loading} />
            <ExpenseChart transactions={transactions} loading={loading} />
            <GoalsCard 
              loading={loading} 
              onAddGoalClick={() => setAddGoalOpen(true)}
              onGoalClick={handleGoalClick}
            />
        </div>
      </div>
      
      <div className="relative z-10">
        <TransactionList transactions={transactions} loading={loading} />
      </div>
      
      {/* Espaçador físico para garantir que o último item da lista não seja coberto pelo botão flutuante */}
      <div className="h-[120px]" />
    </div>
  );


  return (
    <AuthGuard>
      <div className="relative flex min-h-screen w-full flex-col bg-background">
        <main className="flex-1">
          {loading ? <DashboardSkeleton /> : <MainContent />}
        </main>
        
        <AddTransactionDialog 
            open={isAddTransactionOpen}
            onOpenChange={setAddTransactionOpen}
            initialDate={dialogInitialDate}
        />
        <AddGoalDialog 
            open={isAddGoalOpen} 
            onOpenChange={setAddGoalOpen} 
        />
        <UpdateGoalDialog
            open={isUpdateGoalOpen}
            onOpenChange={setUpdateGoalOpen}
            goal={selectedGoal}
        />
        
        <Button 
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg shadow-primary/30"
            onClick={() => setAddTransactionOpen(true)}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </AuthGuard>
  );
}
