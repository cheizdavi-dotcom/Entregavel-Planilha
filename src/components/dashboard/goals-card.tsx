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
import { collection, onSnapshot, query } from 'firebase/firestore';
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
    const percentage = goal.totalValue > 0 ? (goal.currentValue / goal.totalValue) * 100 : 0;
  
    return (
      <div key={goal.id} className="mb-4 last:mb-0 cursor-pointer" onClick={() => onClick(goal)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{goal.name}</h3>
          <span className="text-xs text-muted-foreground font-inter font-bold">
            {formatCurrency(goal.currentValue)} / {formatCurrency(goal.totalValue)}
          </span>
        </div>
        <Progress value={percentage} className="h-3 mt-1 rounded-full overflow-hidden" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500" />
      </div>
    );
};

const EmptyState = ({ onAddGoalClick }: { onAddGoalClick: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <p className="font-semibold">Defina Objetivos Financeiros</p>
        <p className="text-sm mb-4">Para acompanhar seu progresso e manter o foco.</p>
        <Button size="sm" onClick={onAddGoalClick}><Plus className="mr-2 h-4 w-4" /> Adicionar Meta</Button>
    </div>
);

const SkeletonLoader = () => (
    <div className="space-y-4 p-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
        </div>
    </div>
);

const GoalsCard: React.FC<GoalsCardProps> = ({ loading, onAddGoalClick, onGoalClick }) => {
    const { user } = useAuth();
    const [goals, setGoals] = React.useState<Goal[]>([]);
    const [internalLoading, setInternalLoading] = React.useState(true);

    React.useEffect(() => {
        if (user?.uid && db) {
            setInternalLoading(true);
            const q = query(
                collection(db, 'users', user.uid, 'goals')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const userGoals: Goal[] = [];
                querySnapshot.forEach((doc) => {
                    userGoals.push({ id: doc.id, ...doc.data() } as Goal);
                });
                setGoals(userGoals);
                setInternalLoading(false);
            }, () => {
                setInternalLoading(false);
            });

            return () => unsubscribe();
        } else if (!user) {
            setInternalLoading(false);
        }
    }, [user]);

    const isLoading = loading || internalLoading;
    const hasGoals = goals.length > 0;

    return (
        <Card className="glass-dark h-full flex flex-col">
            <CardHeader>
                <CardTitle>Rastreador de Sonhos</CardTitle>
                <CardDescription>Acompanhe seu progresso para alcançar seus objetivos.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
                {isLoading ? (
                    <SkeletonLoader />
                ) : hasGoals ? (
                    <div className="space-y-4">
                        {goals.map((goal) => (
                            <GoalItem key={goal.id} goal={goal} onClick={onGoalClick} />
                        ))}
                         <Button variant="outline" size="sm" className="w-full mt-4" onClick={onAddGoalClick}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Nova Meta
                        </Button>
                    </div>
                ) : (
                    <EmptyState onAddGoalClick={onAddGoalClick} />
                )}
            </CardContent>
        </Card>
    );
};

export default GoalsCard;
