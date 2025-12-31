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
  creditorName: z.string().min(2, 'Nome muito curto.').max(50),
  totalValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) > 0, { message: 'Valor deve ser maior que zero.' }),
  paidValue: z.string()
    .refine(val => /^\d+([,.]\d{1,2})?$/.test(val), { message: 'Valor inválido.' })
    .refine(val => parseFloat(val.replace(',', '.')) >= 0, { message: 'Valor não pode ser negativo.' }),
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
      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('creditorName', values.creditorName);
      formData.append('totalValue', values.totalValue.replace(',', '.'));
      formData.append('paidValue', values.paidValue.replace(',', '.'));

      const result = await addDebtAction(formData);

      if (result?.errors) {
        // Find first error and display it
        const firstErrorField = Object.keys(result.errors)[0] as keyof typeof result.errors;
        const firstErrorMessage = result.errors[firstErrorField]?.[0];
        toast({ variant: 'destructive', title: 'Erro ao Adicionar Dívida', description: firstErrorMessage || 'Verifique os dados e tente novamente.' });
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
      form.reset({
        creditorName: '',
        totalValue: '',
        paidValue: '0',
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Total</FormLabel>
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
                    name="paidValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Já Pago</FormLabel>
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
                </div>
                
                <DialogFooter className='pt-4 sticky bottom-0 bg-background pb-0'>
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
