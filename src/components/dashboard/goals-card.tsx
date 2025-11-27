'use client';

import * as React from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Goal } from '@/types';
import { formatCurrency } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Trophy } from 'lucide-react';
import { AddGoalDialog } from './add-goal-dialog';

interface GoalsCardProps {
  loading: boolean;
}

const goalIcons: { [key: string]: string } = {
    default: '🎯',
    viagem: '✈️',
    carro: '🚗',
    casa: '🏠',
    iphone: '📱',
    macbook: '💻',
    investimento: '📈',
    emergência: '🆘',
};

const findIconForGoal = (name: string): string => {
    const lowerName = name.toLowerCase();
    for (const key in goalIcons) {
        if (lowerName.includes(key)) {
            return goalIcons[key];
        }
    }
    return goalIcons.default;
};

const SkeletonLoader = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
            </div>
        </div>
    </div>
);

const EmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
    <Target className="h-10 w-10 mb-4 text-primary" />
    <p className="font-semibold">Crie sua primeira meta!</p>
    <p className="text-sm">Defina objetivos para suas economias e acompanhe seu progresso.</p>
  </div>
);

const GoalItem = ({ goal }: { goal: Goal }) => {
    const percentage = goal.totalValue > 0 ? (goal.currentValue / goal.totalValue) * 100 : 0;
    const isCompleted = percentage >= 100;

    if (isCompleted) {
        return (
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3 border border-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
                <div className="flex-1">
                    <p className="font-bold text-primary">{goal.name}</p>
                    <p className="text-sm font-semibold text-primary/80">Conquista Desbloqueada!</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(goal.totalValue)}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <p className="font-semibold text-sm flex items-center gap-2">
                    <span>{findIconForGoal(goal.name)}</span>
                    {goal.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{formatCurrency(goal.currentValue)}</span> / {formatCurrency(goal.totalValue)}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Progress value={percentage} indicatorClassName="bg-gradient-to-r from-cyan-400 to-blue-500" className="h-2 flex-1" />
                <span className="text-sm font-bold w-12 text-right">{percentage.toFixed(0)}%</span>
            </div>
        </div>
    );
};

export default function GoalsCard({ loading: initialLoading }: GoalsCardProps) {
  const { user } = useAuth();
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddGoalOpen, setAddGoalOpen] = React.useState(false);

  React.useEffect(() => {
    if (user?.uid) {
      if (!db) return;
      const q = query(collection(db, 'users', user.uid, 'goals'), orderBy('totalValue', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userGoals: Goal[] = [];
        snapshot.forEach((doc) => {
          userGoals.push({ id: doc.id, ...doc.data() } as Goal);
        });
        setGoals(userGoals);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching goals: ", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!user) {
        setLoading(false);
    }
  }, [user]);

  const isLoading = initialLoading || loading;

  return (
    <>
      <Card className="glass-dark h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Meus Objetivos</CardTitle>
            <CardDescription>Acompanhe seu progresso</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddGoalOpen(true)}>Nova Meta</Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <SkeletonLoader />
          ) : goals.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {goals.map(goal => <GoalItem key={goal.id} goal={goal} />)}
            </div>
          )}
        </CardContent>
      </Card>
      <AddGoalDialog open={isAddGoalOpen} onOpenChange={setAddGoalOpen} />
    </>
  );
}
