'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Debt } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AddDebtDialog } from '@/components/debts/add-debt-dialog';
import { UpdateDebtDialog } from '@/components/debts/update-debt-dialog';
import AppSidebar from '@/components/app-sidebar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDebtAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface DebtCardProps {
    debt: Debt;
    onAmortizeClick: (debt: Debt) => void;
    onDeleteClick: (debt: Debt) => void;
}

const DebtCard = ({ debt, onAmortizeClick, onDeleteClick }: DebtCardProps) => {
    const percentage = debt.totalValue > 0 ? (debt.paidValue / debt.totalValue) * 100 : 0;
    const remaining = debt.totalValue - debt.paidValue;
    const isPaid = remaining <= 0;
    const hasHighInterest = debt.interestRate > 5;

    return (
        <Card className="glass-dark flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-primary/20">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{debt.creditorName}</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isPaid ? 'text-primary' : 'text-destructive'}`}>{isPaid ? 'Quitado' : 'Em Aberto'}</span>
                        <div className={`h-2.5 w-2.5 rounded-full ${isPaid ? 'bg-primary' : 'bg-destructive'}`}></div>
                    </div>
                </div>
                 {hasHighInterest && !isPaid && (
                    <Badge variant="destructive" className="mt-2 w-fit">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Juros Críticos: {debt.interestRate}%
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <Progress value={percentage} className="h-3" indicatorClassName={isPaid ? "bg-primary" : "bg-destructive"}/>
                <div className="text-sm text-muted-foreground">
                    {isPaid ? (
                        <p className="font-semibold text-primary">Parabéns! Dívida quitada.</p>
                    ) : (
                        <p>Faltam <span className="font-bold text-foreground font-inter">{formatCurrency(remaining)}</span> para sua liberdade</p>
                    )}
                </div>
                <div className="text-xs text-muted-foreground font-inter font-bold">
                    {formatCurrency(debt.paidValue)} / {formatCurrency(debt.totalValue)}
                </div>
            </CardContent>
            <CardFooter className="pt-4 flex gap-2">
                {!isPaid && (
                     <Button onClick={() => onAmortizeClick(debt)} className="w-full">Amortizar</Button>
                )}
                 <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="shrink-0" disabled={isPaid}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
            </CardFooter>
        </Card>
    );
};

const SkeletonCard = () => (
    <Card className="glass-dark">
        <CardHeader>
            <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

const EmptyState = ({ onAddClick }: { onAddClick: () => void }) => (
    <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/80 py-12 text-center">
        <h3 className="text-xl font-semibold">Você está livre de dívidas!</h3>
        <p className="text-muted-foreground mt-2 mb-6">Nenhuma dívida cadastrada. Adicione uma para começar a exterminá-la.</p>
        <Button onClick={onAddClick}><Plus className="mr-2 h-4 w-4" /> Cadastrar Dívida</Button>
    </div>
);

export default function DividasPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [debts, setDebts] = React.useState<Debt[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAddOpen, setAddOpen] = React.useState(false);
    const [isUpdateOpen, setUpdateOpen] = React.useState(false);
    const [selectedDebt, setSelectedDebt] = React.useState<Debt | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if (user && db) {
            setLoading(true);
            const q = query(collection(db, `users/${user.uid}/debts`));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const debtsData: Debt[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const aRemaining = data.totalValue - data.paidValue;
                    const aIsPaid = aRemaining <= 0;
                    debtsData.push({ id: doc.id, isPaid: aIsPaid, remaining: aRemaining, ...data } as Debt);
                });

                debtsData.sort((a,b) => {
                    if (a.isPaid && !b.isPaid) return 1;
                    if (!a.isPaid && b.isPaid) return -1;
                    return b.remaining - a.remaining;
                });

                setDebts(debtsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching debts: ", error);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (!user) {
            setDebts([]);
            setLoading(false);
        }
    }, [user]);


    const handleAmortizeClick = (debt: Debt) => {
        setSelectedDebt(debt);
        setUpdateOpen(true);
    };

    const handleDelete = async (debt: Debt | null) => {
        if (!user || !debt) return;
    
        setIsDeleting(true);
        try {
          const formData = new FormData();
          formData.append('userId', user.uid);
          formData.append('debtId', debt.id);
    
          const result = await deleteDebtAction(formData);
    
          if (result?.errors) {
            toast({ variant: 'destructive', title: 'Erro ao Excluir Dívida', description: result.errors._server?.[0] });
          } else {
            toast({ title: 'Dívida Excluída', description: 'A dívida foi removida com sucesso.' });
          }
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
        } finally {
          setIsDeleting(false);
          setSelectedDebt(null);
        }
    };

    return (
        <AuthGuard>
            <div className="relative flex min-h-screen w-full flex-col bg-background">
                <AppSidebar />
                <main className="flex-1 pl-0 md:pl-16">
                    <div className="p-4 md:p-8 pt-6">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold tracking-tight">Exterminador de Dívidas</h1>
                            <p className="text-muted-foreground">Monitore e elimine suas dívidas para alcançar sua liberdade financeira.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                <>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </>
                            ) : debts.length > 0 ? (
                                debts.map(debt => (
                                    <AlertDialog key={debt.id}>
                                        <DebtCard 
                                            debt={debt} 
                                            onAmortizeClick={handleAmortizeClick} 
                                            onDeleteClick={() => setSelectedDebt(debt)}
                                        />
                                         <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta dívida.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting} onClick={() => setSelectedDebt(null)}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDelete(debt)} 
                                                disabled={isDeleting}
                                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                            >
                                                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ))
                            ) : (
                                <EmptyState onAddClick={() => setAddOpen(true)} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            <AddDebtDialog open={isAddOpen} onOpenChange={setAddOpen} />
            <UpdateDebtDialog open={isUpdateOpen} onOpenChange={setUpdateOpen} debt={selectedDebt} />

             <Button 
                className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg shadow-primary/30 z-50"
                onClick={() => setAddOpen(true)}
            >
                <Plus className="h-8 w-8" />
            </Button>
        </AuthGuard>
    );
}
