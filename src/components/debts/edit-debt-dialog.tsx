'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Debt } from '@/types';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
import { CurrencyInput } from '../ui/currency-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const debtCategories = ["Cartão de Crédito", "Empréstimo Pessoal", "Financiamento", "Outras"];

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto.').max(50),
  totalAmount: z.string()
    .refine(val => val && parseFloat(val.replace(',', '.')) > 0, { message: 'Valor deve ser maior que zero.' }),
  currentBalance: z.string()
    .refine(val => val && parseFloat(val.replace(',', '.')) >= 0, { message: 'Valor não pode ser negativo.' }),
  monthlyPayment: z.string()
    .refine(val => val && parseFloat(val.replace(',', '.')) > 0, { message: 'A parcela deve ser maior que zero.' }),
  dueDate: z.string().min(1, 'Selecione o dia do vencimento.'),
  endDate: z.date().optional(),
  category: z.string().min(1, 'Selecione uma categoria.'),
}).refine(data => {
    if (!data.totalAmount || !data.currentBalance) return true;
    return parseFloat(data.currentBalance.replace(',', '.')) <= parseFloat(data.totalAmount.replace(',', '.'))
}, {
    message: "O saldo atual não pode ser maior que o valor total.",
    path: ["currentBalance"],
});

interface EditDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
  onUpdateDebt: (debt: Debt) => void;
}

export function EditDebtDialog({ open, onOpenChange, debt, onUpdateDebt }: EditDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      totalAmount: '',
      currentBalance: '',
      monthlyPayment: '',
      category: '',
      dueDate: '',
      endDate: undefined,
    },
  });

  React.useEffect(() => {
    if (debt && open) {
      form.reset({
        name: debt.name,
        totalAmount: String(debt.totalAmount).replace('.', ','),
        currentBalance: String(debt.currentBalance).replace('.', ','),
        monthlyPayment: String(debt.monthlyPayment).replace('.', ','),
        category: debt.category,
        dueDate: String(debt.dueDate),
        endDate: debt.endDate ? new Date(debt.endDate) : undefined,
      });
    }
  }, [debt, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!debt) return;
    setIsSubmitting(true);

    try {
      const totalAmount = parseFloat(values.totalAmount.replace(',', '.'));
      const currentBalance = parseFloat(values.currentBalance.replace(',', '.'));
      const monthlyPayment = parseFloat(values.monthlyPayment.replace(',', '.'));
      
      onUpdateDebt({
        ...debt, // Keep id and userId
        name: values.name,
        totalAmount,
        currentBalance,
        monthlyPayment,
        dueDate: parseInt(values.dueDate),
        endDate: values.endDate?.toISOString(),
        category: values.category,
      });

      toast({ title: 'Sucesso!', description: 'Sua dívida foi atualizada.', className: 'bg-primary text-primary-foreground' });
      form.reset();
      onOpenChange(false);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 w-[95%] md:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Dívida</DialogTitle>
          <DialogDescription>Ajuste as informações da sua dívida.</DialogDescription>
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
                              <CurrencyInput placeholder="1.000,00" className="pl-10 font-inter font-bold text-right" disabled={isSubmitting} value={field.value} onValueChange={field.onChange}/>
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
                              <CurrencyInput placeholder="800,00" className="pl-10 font-inter font-bold text-right" disabled={isSubmitting} value={field.value} onValueChange={field.onChange}/>
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
                              <CurrencyInput placeholder="100,00" className="pl-10 font-inter font-bold text-right" disabled={isSubmitting} value={field.value} onValueChange={field.onChange}/>
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
                 <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Quitação (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value ? (
                                format(field.value, "MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Escolha o mês e ano</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown-buttons"
                            fromYear={new Date().getFullYear() - 5}
                            toYear={new Date().getFullYear() + 25}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className='pt-4 sticky bottom-0'>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
