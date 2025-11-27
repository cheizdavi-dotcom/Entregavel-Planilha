'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransactionAction } from '@/app/actions';

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
import { Plus, Briefcase, GraduationCap, Utensils, Home, Car, PartyPopper, HeartPulse, Landmark, PiggyBank } from 'lucide-react';
import { categoriesConfig, Category } from '@/lib/categories';

const formSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Selecione o tipo.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  description: z.string().min(2, { message: 'Descrição muito curta.' }).max(50),
  category: z.string({ required_error: 'Selecione uma categoria.' }),
});

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const Icon = categoriesConfig[category]?.icon;
    return Icon ? <Icon className={className} /> : null;
};

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
    },
  });

  const transactionType = form.watch('type');

  const availableCategories = Object.values(categoriesConfig).filter(cat => cat.type === transactionType);

  // Reset category when type changes
  React.useEffect(() => {
    form.reset({
        ...form.getValues(),
        category: '',
    });
  }, [transactionType, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const formData = new FormData();
    formData.append('userId', user.uid);
    formData.append('type', values.type);
    formData.append('amount', values.amount.toString());
    formData.append('description', values.description);
    formData.append('category', values.category);

    const result = await addTransactionAction(formData);

    if (result?.errors) {
        toast({
            variant: 'destructive',
            title: 'Erro ao adicionar transação',
            description: 'Por favor, verifique os campos e tente novamente.',
        });
    } else {
        toast({
            title: 'Sucesso!',
            description: 'Sua transação foi adicionada.',
        });
        form.reset({ type: 'expense', description: '', amount: 0, category: '' });
        setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg shadow-primary/30">
          <Plus className="h-8 w-8" />
        </Button>
      </DialogTrigger>
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

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                        <Input type="number" step="0.01" placeholder="0,00" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Café da tarde" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <DialogFooter className='pt-4'>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar Transação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
