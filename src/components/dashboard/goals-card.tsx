'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { Goal } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface GoalsCardProps {
    loading: boolean;
    onAddGoalClick: () => void;
    onGoalClick: (goal: Goal) => void;
}

interface GoalItemProps {
    goal: Goal;
    onClick: (goal: Goal) => void;
}

const GoalItem: React.FC<GoalItemProps> = ({ goal, onClick }) => {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  
    return (
      <div key={goal.id} className="mb-4 last:mb-0 cursor-pointer" onClick={() => onClick(goal)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{goal.description}</h3>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <Progress value={percentage} className="h-2 mt-1" />
      </div>
    );
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <p className="font-semibold">Defina Objetivos Financeiros</p>
        <p className="text-sm">Para acompanhar seu progresso e manter o foco.</p>
    </div>
);

const SkeletonLoader = () => (
    <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
    </div>
);

const GoalsCard: React.FC<GoalsCardProps> = ({ loading, onAddGoalClick, onGoalClick }) => {
    const { user } = useAuth();
    const [goals, setGoals] = React.useState<Goal[]>([]);

    React.useEffect(() => {
        if (user?.uid && db) {
            const q = query(
                collection(db, 'users', user.uid, 'goals'),
                where('targetAmount', '>', 0) //Simple way to ensure only valid goals are displayed (avoid div by zero)
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const userGoals: Goal[] = [];
                querySnapshot.forEach((doc) => {
                    userGoals.push({ id: doc.id, ...doc.data() } as Goal);
                });
                setGoals(userGoals);
            });

            return () => unsubscribe();
        }
    }, [user]);

    const hasGoals = goals.length > 0;

    return (
        <Card className="glass-dark">
            <CardHeader>
                <CardTitle>Metas Financeiras</CardTitle>
                <CardDescription>Acompanhe seu progresso.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
                {loading ? (
                    <SkeletonLoader />
                ) : hasGoals ? (
                    <div className="space-y-4">
                        {goals.map((goal) => (
                            <GoalItem key={goal.id} goal={goal} onClick={onGoalClick} />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
                <Button size="sm" className="absolute bottom-2 right-2" onClick={onAddGoalClick}><Plus className="mr-2 h-4 w-4" /> Adicionar Meta</Button>
            </CardContent>
        </Card>
    );
};

export default GoalsCard;
