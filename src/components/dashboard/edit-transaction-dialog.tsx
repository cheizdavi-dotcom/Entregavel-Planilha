'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoriesConfig } from '@/lib/categories';
import type { Transaction } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CurrencyInput } from '../ui/currency-input';
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

const formSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo.' }),
  amount: z.string()
    .refine(val => /^\d*([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido. Use apenas números e vírgula/ponto para centavos.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'O valor deve ser maior que zero.' }),
  description: z.string().min(2, { message: 'Descrição muito curta.' }).max(50),
  category: z.string({ required_error: 'Selecione uma categoria.' }).min(1, 'Selecione uma categoria.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  paymentMethod: z.string({ required_error: 'Selecione o tipo de pagamento.' }),
  installments: z.string().optional(),
});

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const Icon = categoriesConfig[category]?.icon;
    return Icon ? <Icon className={className} /> : null;
};

interface EditTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
}

export function EditTransactionDialog({ open, onOpenChange, transaction, onUpdateTransaction, onDeleteTransaction }: EditTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  }

  React.useEffect(() => {
    if (transaction && open) {
      form.reset({
        type: transaction.type,
        description: transaction.description,
        amount: String(transaction.amount).replace('.', ','),
        category: transaction.category,
        date: new Date(transaction.date),
        paymentMethod: transaction.paymentMethod,
        installments: String(transaction.installments || '1'),
      });
    }
  }, [transaction, open, form]);

  const transactionType = form.watch('type');
  const paymentMethod = form.watch('paymentMethod');
  
  React.useEffect(() => {
    // Evita resetar a categoria no carregamento inicial do formulário
    if (form.formState.isDirty && form.getValues('type') !== transaction?.type) {
        form.setValue('category', '');
    }
  }, [transactionType, form, transaction]);

  const availableCategories = Object.values(categoriesConfig).filter(cat => cat.type === transactionType);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
        const amountAsNumber = parseFloat(values.amount.replace(',', '.'));
        const transactionData: Transaction = {
          id: transaction.id,
          userId: transaction.userId,
          type: values.type,
          amount: amountAsNumber,
          description: values.description,
          category: values.category,
          date: values.date.toISOString(),
          paymentMethod: values.paymentMethod as any,
          installments: values.paymentMethod === 'Cartão de Crédito' ? parseInt(values.installments || '1') : 1,
        };

        onUpdateTransaction(transactionData);
        handleClose();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Algo deu errado.',
            description: error.message || 'Ocorreu um erro inesperado ao salvar.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;

    setIsDeleting(true);
    try {
      onDeleteTransaction(transaction.id);
      handleClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 w-[95%] md:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>Ajuste os detalhes da sua movimentação.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mr-6 pr-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                        disabled={isSubmitting}
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="expense" />
                            </FormControl>
                            <FormLabel className="font-normal">Despesa</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="income" />
                            </FormControl>
                            <FormLabel className="font-normal">Receita</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground font-inter font-bold">R$</span>
                              <CurrencyInput 
                                placeholder="0,00" 
                                className="pl-10 font-inter font-bold text-right" 
                                disabled={isSubmitting}
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                            <FormLabel className="mb-[11px]">Data</FormLabel>
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
                                        format(field.value, "dd/MM/yy")
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    locale={ptBR}
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Café da tarde" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {availableCategories.map(cat => (
                            <SelectItem key={cat.label} value={cat.label}>
                                <div className="flex items-center gap-2">
                                    <CategoryIcon category={cat.label} className="h-4 w-4" />
                                    {cat.label}
                                </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o pagamento" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Pix">Pix</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    {paymentMethod === 'Cartão de Crédito' && (
                        <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parcelas</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || '1'}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {[...Array(12)].map((_, i) => (
                                            <SelectItem key={i+1} value={`${i+1}`}>{`${i+1}x`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
                
                <DialogFooter className='pt-4 sticky bottom-0 bg-background pb-0 flex-col gap-2 sm:flex-row sm:justify-between'>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" className='w-full sm:w-auto' disabled={isSubmitting || isDeleting}>
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex-1 flex justify-end gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
