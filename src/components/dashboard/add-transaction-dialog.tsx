'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransactionAction } from '@/app/actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoriesConfig } from '@/lib/categories';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const formSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo.' }),
  amount: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido. Use apenas números e vírgula/ponto para centavos.' })
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

interface AddTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate: Date;
}

export function AddTransactionDialog({ open, onOpenChange, initialDate }: AddTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: '',
      date: initialDate,
      paymentMethod: 'Dinheiro',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        type: 'expense',
        description: '',
        amount: '',
        category: undefined,
        date: initialDate,
        paymentMethod: 'Dinheiro',
        installments: '1',
      });
    }
  }, [open, initialDate, form]);

  const transactionType = form.watch('type');
  const paymentMethod = form.watch('paymentMethod');
  
  React.useEffect(() => {
    form.resetField('category');
  }, [transactionType, form]);

  const availableCategories = Object.values(categoriesConfig).filter(cat => cat.type === transactionType);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Usuário não autenticado',
            description: 'Por favor, faça login para adicionar uma transação.',
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
        const amountAsNumber = parseFloat(values.amount.replace(',', '.'));

        const formData = new FormData();
        formData.append('userId', user.uid);
        formData.append('type', values.type);
        formData.append('amount', amountAsNumber.toString());
        formData.append('description', values.description);
        formData.append('category', values.category);
        formData.append('date', values.date.toISOString().split('T')[0]);
        formData.append('paymentMethod', values.paymentMethod);
        if (values.paymentMethod === 'Cartão de Crédito' && values.installments) {
            formData.append('installments', values.installments);
        }

        const result = await addTransactionAction(formData);

        if (result?.errors) {
            const serverError = result.errors._server?.[0];
            toast({
                variant: 'destructive',
                title: 'Erro ao Adicionar Transação',
                description: serverError || 'Por favor, verifique os campos e tente novamente.',
            });
        } else {
            toast({
                title: 'Sucesso!',
                description: 'Sua transação foi adicionada.',
                className: 'bg-primary text-primary-foreground'
            });
            onOpenChange(false);
        }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
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
                      defaultValue={field.value}
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
                            <Input type="text" placeholder="0,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                            <Select onValueChange={field.onChange} defaultValue="1">
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

            <DialogFooter className='pt-4'>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Transação"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
