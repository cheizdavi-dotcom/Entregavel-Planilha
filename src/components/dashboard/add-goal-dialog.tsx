'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addGoalAction } from '@/app/actions';

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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome muito curto.' }).max(50),
  totalValue: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.'))), { message: 'Valor inválido.'}),
  currentValue: z.string().refine(val => !isNaN(parseFloat(val.replace(',', '.'))), { message: 'Valor inválido.'}),
});

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      totalValue: '0',
      currentValue: '0',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Usuário não autenticado' });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const totalValue = parseFloat(values.totalValue.replace(',', '.'));
      const currentValue = parseFloat(values.currentValue.replace(',', '.'));

      if (isNaN(totalValue) || totalValue <= 0) {
          form.setError('totalValue', { message: 'O valor total deve ser positivo.' });
          setIsSubmitting(false);
          return;
      }
       if (isNaN(currentValue) || currentValue < 0) {
          form.setError('currentValue', { message: 'O valor atual deve ser positivo ou zero.' });
          setIsSubmitting(false);
          return;
      }

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('name', values.name);
      formData.append('totalValue', totalValue.toString());
      formData.append('currentValue', currentValue.toString());

      const result = await addGoalAction(formData);

      if (result?.errors) {
        toast({ variant: 'destructive', title: 'Erro ao Adicionar Meta', description: result.errors._server?.[0] });
      } else {
        toast({ title: 'Sucesso!', description: 'Sua meta foi adicionada.', className: 'bg-primary text-primary-foreground' });
        form.reset();
        onOpenChange(false);
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para o Japão" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input type="text" placeholder="5.000,00" {...field} className="pl-10" disabled={isSubmitting}/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Já Guardado</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input type="text" placeholder="1.500,00" {...field} className="pl-10" disabled={isSubmitting}/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className='pt-4'>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Meta"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
