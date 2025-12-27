'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDebtAction } from '@/app/actions';

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
  creditorName: z.string().min(2, { message: 'O nome do credor é muito curto.' }).max(50),
  totalValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'O valor total deve ser maior que zero.' }),
  paidValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) >= 0, { message: 'O valor pago não pode ser negativo.' }),
}).refine(data => parseFloat(data.paidValue.replace(',', '.')) <= parseFloat(data.totalValue.replace(',', '.')), {
    message: "O valor pago não pode ser maior que o valor total.",
    path: ["paidValue"],
});


interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDebtDialog({ open, onOpenChange }: AddDebtDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditorName: '',
      totalValue: '',
      paidValue: '0',
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
      const paidValue = parseFloat(values.paidValue.replace(',', '.'));

      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('creditorName', values.creditorName);
      formData.append('totalValue', totalValue.toString());
      formData.append('paidValue', paidValue.toString());

      const result = await addDebtAction(formData);

      if (result?.errors) {
        toast({ variant: 'destructive', title: 'Erro ao Adicionar Dívida', description: result.errors._server?.[0] || 'Verifique os dados e tente novamente.' });
      } else {
        toast({ title: 'Sucesso!', description: 'Sua dívida foi adicionada.', className: 'bg-primary text-primary-foreground' });
        form.reset();
        onOpenChange(false);
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Uh oh! Algo deu errado.', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  React.useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-dark border-border/20">
        <DialogHeader>
          <DialogTitle>Nova Dívida</DialogTitle>
          <DialogDescription>Cadastre uma dívida para começar a quitá-la.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="creditorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Credor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Banco do Brasil" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor Total</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                        <Input type="text" placeholder="1.000,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="paidValue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor Já Pago</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                        <Input type="text" placeholder="100,00" {...field} className="pl-10 font-inter font-bold" disabled={isSubmitting}/>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter className='pt-4'>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar Dívida"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
