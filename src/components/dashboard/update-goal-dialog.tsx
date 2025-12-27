'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateGoalAction, deleteGoalAction } from '@/app/actions';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Goal } from '@/types';
import { formatCurrency } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  currentValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido. Use números e, se precisar, vírgula ou ponto para centavos.' })
    .refine(val => parseFloat(val.replace(',', '.')) >= 0, { message: 'O valor não pode ser negativo.' }),
});


interface UpdateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function UpdateGoalDialog({ open, onOpenChange, goal }: UpdateGoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentValue: '0',
    },
  });
  
  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !goal) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Usuário ou meta não encontrados.'});
        return;
    };
    
    setIsSubmitting(true);
    try {
      const currentValueAsNumber = parseFloat(values.currentValue.replace(',', '.'));
      
      if (currentValueAsNumber > goal.totalValue) {
        form.setError('currentValue', { message: 'O valor guardado não pode ser maior que o total da meta.' });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('goalId', goal.id);
      formData.append('currentValue', String(currentValueAsNumber));
      formData.append('totalValue', String(goal.totalValue));

      const result = await updateGoalAction(formData);

      if (result?.errors) {
        if (result.errors.currentValue) {
            form.setError('currentValue', { message: result.errors.currentValue[0] });
        } else {
            toast({ variant: 'destructive', title: 'Erro ao Atualizar Meta', description: result.errors._server?.[0] });
        }
      } else {
        const updatedGoals = goals.map(g => g.id === goal.id ? { ...g, currentValue: currentValueAsNumber } : g);
        setGoals(updatedGoals);
        toast({ title: 'Sucesso!', description: 'Sua meta foi atualizada.', className: 'bg-primary text-primary-foreground' });
        handleClose();
      }
    } catch (error: any) {
        console.error("Update Goal Submit Error:", error);
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !goal) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('goalId', goal.id);

      const result = await deleteGoalAction(formData);

      if (result?.errors) {
        toast({ variant: 'destructive', title: 'Erro ao Excluir Meta', description: result.errors._server?.[0] });
      } else {
        const updatedGoals = goals.filter(g => g.id !== goal.id);
        setGoals(updatedGoals);
        toast({ title: 'Meta Excluída', description: 'Seu objetivo foi removido com sucesso.' });
        handleClose();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  }
  
  React.useEffect(() => {
    if (goal) {
      form.reset({
        currentValue: String(goal.currentValue).replace('.', ',')
      });
    }
  }, [goal, form, open]);

  const remainingValue = goal ? goal.totalValue - goal.currentValue : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Gerenciar: {goal?.name || 'Meta'}</DialogTitle>
          <DialogDescription>
            {remainingValue > 0 
                ? `Faltam ${formatCurrency(remainingValue)} para atingir seu objetivo.`
                : 'Parabéns! Você alcançou esta meta.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Guardado</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input type="text" placeholder="100,00" {...field} className="pl-10 text-2xl h-14" disabled={isSubmitting}/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className='pt-4 flex-col gap-2 sm:flex-row'>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className='w-full sm:w-auto' disabled={isSubmitting || isDeleting}>
                      Excluir Meta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua meta e removerá seus dados de nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className='flex-1 flex justify-end gap-2'>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
