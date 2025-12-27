'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateDebtAction, deleteDebtAction } from '@/app/actions';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Debt } from '@/types';
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
  paymentValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'O valor do pagamento deve ser positivo.' }),
});

interface UpdateDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
}

export function UpdateDebtDialog({ open, onOpenChange, debt }: UpdateDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentValue: '',
    },
  });
  
  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !debt) return;
    
    setIsSubmitting(true);
    try {
      const paymentValue = parseFloat(values.paymentValue.replace(',', '.'));
      const newPaidValue = debt.paidValue + paymentValue;
      
      if (newPaidValue > debt.totalValue) {
        form.setError('paymentValue', { message: `O pagamento excede a dívida. Faltam ${formatCurrency(debt.totalValue - debt.paidValue)}.` });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('debtId', debt.id);
      formData.append('paidValue', String(newPaidValue));
      formData.append('totalValue', String(debt.totalValue)); // Required by action validation

      const result = await updateDebtAction(formData);

      if (result?.errors) {
        toast({ variant: 'destructive', title: 'Erro ao Amortizar Dívida', description: result.errors.paidValue?.[0] || result.errors._server?.[0] });
      } else {
        const updatedDebts = debts.map(d => d.id === debt.id ? { ...d, paidValue: newPaidValue } : d);
        setDebts(updatedDebts);
        toast({ title: 'Sucesso!', description: 'Sua dívida foi atualizada.', className: 'bg-primary text-primary-foreground' });
        handleClose();
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
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
        const updatedDebts = debts.filter(d => d.id !== debt.id);
        setDebts(updatedDebts);
        toast({ title: 'Dívida Excluída', description: 'A dívida foi removida com sucesso.' });
        handleClose();
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  }
  
  React.useEffect(() => {
    form.reset({ paymentValue: '' });
  }, [debt, form, open]);

  const remainingValue = debt ? debt.totalValue - debt.paidValue : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Amortizar Dívida: {debt?.creditorName || ''}</DialogTitle>
          <DialogDescription>
            {remainingValue > 0 
                ? `Faltam ${formatCurrency(remainingValue)} para quitar esta dívida.`
                : 'Parabéns! Você quitou esta dívida.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paymentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor a Pagar</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input type="text" placeholder="100,00" {...field} className="pl-10 text-2xl h-14 font-inter font-bold" disabled={isSubmitting}/>
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
                      Excluir Dívida
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta dívida.
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
                        {isSubmitting ? "Amortizando..." : "Amortizar"}
                    </Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}