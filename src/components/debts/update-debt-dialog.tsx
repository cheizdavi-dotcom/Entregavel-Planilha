'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
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
    .refine(val => val && parseFloat(val.replace(',', '.')) > 0, { message: 'O valor do pagamento deve ser positivo.' })
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' }),
});

interface UpdateDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  onUpdateDebt: (debt: Debt) => void;
}

export function UpdateDebtDialog({ open, onOpenChange, debt, onUpdateDebt }: UpdateDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  
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
    if (!debt) return;
    
    setIsSubmitting(true);
    try {
      const paymentValue = parseFloat(values.paymentValue.replace(',', '.'));
      const newPaidValue = debt.paidValue + paymentValue;
      
      if (newPaidValue > debt.totalValue) {
        form.setError('paymentValue', { message: `O pagamento excede a dívida. Faltam ${formatCurrency(debt.totalValue - debt.paidValue)}.` });
        setIsSubmitting(false);
        return;
      }

      onUpdateDebt({ ...debt, paidValue: newPaidValue });
      handleClose();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message || 'Ocorreu um erro inesperado.' });
    } finally {
        setIsSubmitting(false);
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
                <div className='flex w-full justify-end gap-2'>
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
