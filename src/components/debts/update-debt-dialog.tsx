'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateDebtAction, deleteDebtAction } from '@/app/actions';
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
  paidValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) >= 0, { message: 'O valor não pode ser negativo.' }),
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paidValue: '0',
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
      const paidValueAsNumber = parseFloat(values.paidValue.replace(',', '.'));
      
      if (paidValueAsNumber > debt.totalValue) {
        form.setError('paidValue', { message: 'O valor pago não pode exceder o valor total da dívida.' });
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('debtId', debt.id);
      formData.append('paidValue', String(paidValueAsNumber));
      formData.append('totalValue', String(debt.totalValue));

      const result = await updateDebtAction(formData);

      if (result?.errors) {
        toast({ variant: 'destructive', title: 'Erro ao Atualizar Dívida', description: result.errors._server?.[0] });
      } else {
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
    if (debt) {
      form.reset({
        paidValue: String(debt.paidValue).replace('.', ',')
      });
    }
  }, [debt, form, open]);

  const remainingValue = debt ? debt.totalValue - debt.paidValue : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Gerenciar Dívida: {debt?.creditorName || ''}</DialogTitle>
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
              name="paidValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Pago</FormLabel>
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
