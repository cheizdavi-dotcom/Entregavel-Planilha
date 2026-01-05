'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Debt } from '@/types';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const debtCategories = ["Cartão de Crédito", "Empréstimo Pessoal", "Financiamento", "Outras"];

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto.').max(50),
  totalAmount: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'Valor deve ser maior que zero.' }),
  currentBalance: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) >= 0, { message: 'Valor não pode ser negativo.' }),
  monthlyPayment: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'A parcela deve ser maior que zero.' }),
  dueDate: z.string().min(1, 'Selecione o dia do vencimento.'),
  category: z.string().min(1, 'Selecione uma categoria.'),
}).refine(data => parseFloat(data.currentBalance.replace(',', '.')) <= parseFloat(data.totalAmount.replace(',', '.')), {
    message: "O saldo atual não pode ser maior que o valor total.",
    path: ["currentBalance"],
});

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDebt: (debt: Omit<Debt, 'id' | 'userId'>) => void;
}

export function AddDebtDialog({ open, onOpenChange, onAddDebt }: AddDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      totalAmount: '',
      currentBalance: '0',
      monthlyPayment: '',
      category: '',
      dueDate: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const totalAmount = parseFloat(values.totalAmount.replace(',', '.'));
      const currentBalance = parseFloat(values.currentBalance.replace(',', '.'));
      const monthlyPayment = parseFloat(values.monthlyPayment.replace(',', '.'));
      
      onAddDebt({
        name: values.name,
        totalAmount,
        currentBalance,
        monthlyPayment,
        dueDate: parseInt(values.dueDate),
        category: values.category,
      });

      form.reset();
      onOpenChange(false);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        totalAmount: '',
        currentBalance: '0',
        monthlyPayment: '',
        category: '',
        dueDate: '',
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 w-[95%] md:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Dívida</DialogTitle>
          <DialogDescription>Cadastre uma dívida para começar a quitá-la.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mr-6 pr-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Nome da Dívida</FormLabel>
                      <FormControl>
                          <Input placeholder="Ex: Fatura Nubank, Financiamento Apto." {...field} disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Valor Total Original</FormLabel>
                          <FormControl>
                              <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground font-inter">R$</span>
                              <Input type="text" placeholder="1.000,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
                              </div>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentBalance"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Quanto Falta Pagar</FormLabel>
                          <FormControl>
                              <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground font-inter">R$</span>
                              <Input type="text" placeholder="800,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
                              </div>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyPayment"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Valor da Parcela</FormLabel>
                          <FormControl>
                              <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground font-inter">R$</span>
                              <Input type="text" placeholder="100,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
                              </div>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Dia do Vencimento</FormLabel>
                               <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger disabled={isSubmitting}>
                                        <SelectValue placeholder="Selecione o dia" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <SelectItem key={day} value={String(day)}>{String(day).padStart(2, '0')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Categoria</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger disabled={isSubmitting}>
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {debtCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          <FormMessage />
                      </FormItem>
                  )}
                />
                
                <DialogFooter className='pt-4 sticky bottom-0 bg-background'>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Salvar Dívida"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
