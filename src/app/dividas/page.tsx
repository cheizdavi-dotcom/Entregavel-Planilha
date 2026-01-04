'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Debt } from '@/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Zap, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AddDebtDialog } from '@/components/debts/add-debt-dialog';
import { UpdateDebtDialog } from '@/components/debts/update-debt-dialog';
import AppSidebar from '@/components/app-sidebar';
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
import { useToast } from '@/hooks/use-toast';

interface DebtCardProps {
    debt: Debt;
    onPayClick: (debt: Debt) => void;
    onDeleteClick: (debt: Debt) => void;
}

const DebtCard = ({ debt, onPayClick, onDeleteClick }: DebtCardProps) => {
    const paidValue = debt.totalAmount - debt.currentBalance;
    const percentage = debt.totalAmount > 0 ? (paidValue / debt.totalAmount) * 100 : 0;
    const isPaid = debt.currentBalance <= 0;
    
    let freedomDate = 'N/A';
    if (!isPaid && debt.monthlyPayment > 0) {
        const monthsRemaining = Math.ceil(debt.currentBalance / debt.monthlyPayment);
        const futureDate = addMonths(new Date(), monthsRemaining);
        freedomDate = format(futureDate, "MMMM 'de' yyyy", { locale: ptBR });
    }

    return (
        <Card className="glass-dark flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-primary/20">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isPaid ? 'text-primary' : 'text-destructive'}`}>{isPaid ? 'Quitado' : 'Em Aberto'}</span>
                        <div className={`h-2.5 w-2.5 rounded-full ${isPaid ? 'bg-primary' : 'bg-destructive'}`}></div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">{debt.category}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={percentage} className="h-3" indicatorClassName={isPaid ? "bg-primary" : "bg-destructive"}/>
                <div className="text-sm text-muted-foreground">
                    {isPaid ? (
                        <p className="font-semibold text-primary">Parabéns! Dívida quitada.</p>
                    ) : (
                        <p>Liberdade em: <span className="font-bold text-foreground font-inter capitalize">{freedomDate}</span></p>
                    )}
                </div>
                 <div className="flex justify-between items-center text-xs text-muted-foreground font-inter font-bold">
                    <span>{formatCurrency(paidValue)} / {formatCurrency(debt.totalAmount)}</span>
                    <span className="text-right">{formatCurrency(debt.monthlyPayment)} / mês</span>
                </div>
            </CardContent>
            <CardFooter className="pt-4 flex gap-2">
                <Button onClick={() => onPayClick(debt)} className="w-full" disabled={isPaid}>
                   <Zap className="mr-2 h-4 w-4" /> Pagar Parcela
                </Button>
                 <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="shrink-0" disabled={isPaid}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
            </CardFooter>
        </Card>
    );
};

const SummaryCard = ({ title, value, icon, loading }: { title: string, value: string, icon: React.ReactNode, loading: boolean }) => {
    if (loading) {
        return (
            <Card className="glass-dark">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-3 w-28 mt-1" />
                </CardContent>
            </Card>
        )
    }
    return (
        <Card className="glass-dark">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold font-inter">{value}</p>
                <p className="text-xs text-muted-foreground">e contando...</p>
            </CardContent>
        </Card>
    )
};


const SkeletonCard = () => (
    <Card className="glass-dark">
        <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
        </CardContent>
        <CardFooter className="flex gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-10" />
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
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [debts, setDebts] = useLocalStorage<Debt[]>(`debts_${user?.uid}`, []);
    const [loading, setLoading] = React.useState(true);
    const [isAddOpen, setAddOpen] = React.useState(false);
    const [isUpdateOpen, setUpdateOpen] = React.useState(false);
    const [selectedDebt, setSelectedDebt] = React.useState<Debt | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading) {
            setLoading(false);
        }
    }, [authLoading]);

    const sortedDebts = React.useMemo(() => {
        return [...debts].sort((a, b) => {
            const isPaidA = a.currentBalance <= 0;
            const isPaidB = b.currentBalance <= 0;
            if (isPaidA && !isPaidB) return 1;
            if (!isPaidA && isPaidB) return -1;
            return b.currentBalance - a.currentBalance;
        });
    }, [debts]);

    const { totalDue, freedomDate } = React.useMemo(() => {
        const activeDebts = debts.filter(d => d.currentBalance > 0);
        const totalDue = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
        
        let freedomDate = "N/A";
        const totalMonthlyPayment = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);

        if (totalDue > 0 && totalMonthlyPayment > 0) {
            const monthsRemaining = Math.ceil(totalDue / totalMonthlyPayment);
            const futureDate = addMonths(new Date(), monthsRemaining);
            freedomDate = format(futureDate, "MMM yyyy", { locale: ptBR });
        } else if (totalDue === 0 && debts.length > 0) {
            freedomDate = "🎉";
        }

        return { totalDue, freedomDate };
    }, [debts]);

    const handleAddDebt = (newDebt: Omit<Debt, 'id' | 'userId'>) => {
        if (!user) return;
        setDebts(prev => [...prev, { ...newDebt, id: uuidv4(), userId: user.uid }]);
        toast({ title: 'Sucesso!', description: 'Sua dívida foi adicionada.', className: 'bg-primary text-primary-foreground' });
    };

    const handleUpdateDebt = (updatedDebt: Debt) => {
        setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
        // A toast para sucesso é mostrada no próprio dialog de atualização
    };

    const handlePayClick = (debt: Debt) => {
        setSelectedDebt(debt);
        setUpdateOpen(true);
    };

    const handleDelete = async (debt: Debt | null) => {
        if (!user || !debt) return;
    
        setIsDeleting(true);
        try {
            setDebts(prev => prev.filter(d => d.id !== debt.id));
            toast({ title: 'Dívida Excluída', description: 'A dívida foi removida com sucesso.' });
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
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Exterminador de Dívidas</h1>
                            <p className="text-muted-foreground">Monitore e elimine suas dívidas para alcançar sua liberdade financeira.</p>
                        </div>

                         <div className="grid gap-4 md:grid-cols-2 mb-6">
                            <SummaryCard 
                                title="Total Devido"
                                value={formatCurrency(totalDue)}
                                icon={<DollarSign className="text-muted-foreground h-5 w-5" />}
                                loading={loading}
                            />
                            <SummaryCard 
                                title="Previsão de Quitação"
                                value={freedomDate}
                                icon={<Calendar className="text-muted-foreground h-5 w-5" />}
                                loading={loading}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                <>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </>
                            ) : sortedDebts.length > 0 ? (
                                sortedDebts.map(debt => (
                                    <AlertDialog key={debt.id}>
                                        <DebtCard 
                                            debt={debt} 
                                            onPayClick={handlePayClick} 
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
            
            <AddDebtDialog open={isAddOpen} onOpenChange={setAddOpen} onAddDebt={handleAddDebt} />
            <UpdateDebtDialog open={isUpdateOpen} onOpenChange={setUpdateOpen} debt={selectedDebt} onUpdateDebt={handleUpdateDebt} />

             <Button 
                className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg shadow-primary/30 z-50 md:bottom-8 md:right-8"
                onClick={() => setAddOpen(true)}
            >
                <Plus className="h-8 w-8" />
            </Button>
        </AuthGuard>
    );
}
