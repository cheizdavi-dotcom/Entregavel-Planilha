'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction, Goal, Debt } from '@/types';
import { startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

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
import AppSidebar from '@/components/app-sidebar';
import { ImportDialog } from '@/components/importer/import-dialog';

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
  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // State for dialogs
  const [isAddTransactionOpen, setAddTransactionOpen] = React.useState(false);
  const [isAddGoalOpen, setAddGoalOpen] = React.useState(false);
  const [isUpdateGoalOpen, setUpdateGoalOpen] = React.useState(false);
  const [isImportOpen, setImportOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);

  const dialogInitialDate = React.useMemo(() => {
    return isSameMonth(currentDate, new Date()) ? new Date() : startOfMonth(currentDate);
  }, [currentDate]);

  React.useEffect(() => {
    if (user && db) {
      setLoading(true);
      const q = query(collection(db, `users/${user.uid}/transactions`), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setAllTransactions(transactionsData);
        setLoading(false);
      }, (error) => {
          console.error("Error fetching transactions:", error);
          setLoading(false);
      });

      return () => unsubscribe();
    } else {
        setAllTransactions([]);
        setLoading(false);
    }
  }, [user]);

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setUpdateGoalOpen(true);
  };

  const handleImportConfirm = async (newTransactions: Omit<Transaction, 'id' | 'userId'>[]) => {
    if (!user || !db) return;
    const batch = newTransactions.map(t => {
      const transactionData = {
        ...t,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      return addDoc(collection(db, `users/${user.uid}/transactions`), transactionData);
    });
    await Promise.all(batch);
  };
  
  const handleResetData = async () => {
    // This is a placeholder. A real implementation would require a backend function
    // to recursively delete all subcollections for a user.
    // For now, we clear the local state as a demonstration.
    console.warn("Resetting data is a complex backend operation. This is a local simulation.");
    setAllTransactions([]);
    setGoals([]);
    setDebts([]);
  };

  const { transactions, prevMonthTransactions } = React.useMemo(() => {
    if (!user) return { transactions: [], prevMonthTransactions: [] };

    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);
    
    const currentMonthT = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= firstDay && tDate <= lastDay;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const prevMonth = subMonths(currentDate, 1);
    const prevMonthFirstDay = startOfMonth(prevMonth);
    const prevMonthLastDay = endOfMonth(prevMonth);
    
    const prevMonthT = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= prevMonthFirstDay && tDate <= prevMonthLastDay;
    });

    return { transactions: currentMonthT, prevMonthTransactions: prevMonthT };
  }, [allTransactions, user, currentDate]);

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
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 md:pt-6">
      <Header 
        currentDate={currentDate} 
        setCurrentDate={setCurrentDate} 
        onImportClick={() => setImportOpen(true)}
        onResetData={handleResetData}
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        <AppSidebar />
        <main className="flex-1 pl-0 md:pl-16">
          {loading && allTransactions.length === 0 ? <DashboardSkeleton /> : <MainContent />}
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
        <ImportDialog
            open={isImportOpen}
            onOpenChange={setImportOpen}
            onConfirm={handleImportConfirm}
        />
        
        <Button 
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg shadow-primary/30 z-50"
            onClick={() => setAddTransactionOpen(true)}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </AuthGuard>
  );
}
