'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ParsedTransaction, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { categoriesConfig, categoryKeywords } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Input } from '../ui/input';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newTransactions: Omit<Transaction, 'id' | 'userId'>[]) => void;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  const Icon = categoriesConfig[category]?.icon;
  return Icon ? <Icon className={className} /> : null;
};

const availableCategories = (type: 'income' | 'expense') => 
    Object.values(categoriesConfig).filter(cat => cat.type === type);

function parseTransactions(text: string): Omit<ParsedTransaction, 'category'>[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const transactions: Omit<ParsedTransaction, 'category'>[] = [];

    // Regex to capture date, value with dot, optional UUID, and description
    const transactionRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(-?\d+\.\d+)\s+(?:[a-f0-9-]{36}\s+)?(.*)/i;

    lines.forEach(line => {
        const match = line.match(transactionRegex);
        
        if (match) {
            const [_, dateStr, valueStr, rawDescription] = match;
            const description = rawDescription.replace(/compra no débito - /i, '').trim();

            const dateParts = dateStr.split('/');
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            
            // Direct conversion from string to float, without replacing dots.
            const amount = parseFloat(valueStr);

            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && !isNaN(amount) && description) {
                transactions.push({
                    date: new Date(year, month, day).toISOString(),
                    amount: Math.abs(amount),
                    description: description.trim(),
                    type: amount >= 0 ? 'income' : 'expense',
                });
            }
        }
    });

    return transactions;
}

function getCategoryFromDescription(description: string, type: 'income' | 'expense'): string {
    const lowerCaseDescription = description.toLowerCase();

    for (const category in categoryKeywords) {
        if (Object.prototype.hasOwnProperty.call(categoryKeywords, category)) {
            const keywords = categoryKeywords[category];
            if (keywords.some(keyword => lowerCaseDescription.includes(keyword))) {
                 if (categoriesConfig[category]?.type === type) {
                    return category;
                }
            }
        }
    }
    
    return type === 'income' ? 'Outras Receitas' : 'Outras Despesas';
}


const exampleText = `Cole aqui o texto da sua fatura... Não precisa organizar nem formatar. Pode colar toda a bagunça que a gente arruma pra você!`;

export function ImportDialog({ open, onOpenChange, onConfirm }: ImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedTransaction[]>([]);
  const [step, setStep] = React.useState<'paste' | 'preview'>('paste');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleParseAndCategorize = async () => {
    setIsProcessing(true);
    if (!text) {
      toast({ variant: 'destructive', title: 'Texto vazio', description: 'Por favor, cole o conteúdo do extrato.' });
      setIsProcessing(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const parsedData = parseTransactions(text);
    
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma transação encontrada', description: 'Verifique o texto colado. O sistema procura por linhas com data, valor e descrição.' });
        setIsProcessing(false);
        return;
    }
    
    const categorizedData = parsedData.map(p => ({
        ...p,
        category: getCategoryFromDescription(p.description, p.type)
    }));

    setParsed(categorizedData);
    setStep('preview');
    setIsProcessing(false);
  };

  const handleConfirmImport = () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const newTransactions = parsed.map((p) => ({
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
        category: p.category || (p.type === 'income' ? 'Outras Receitas' : 'Outras Despesas'),
        paymentMethod: 'Pix', // Default
      }));
      
      onConfirm(newTransactions);

      handleClose();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro ao importar', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFieldChange = (index: number, field: keyof ParsedTransaction, value: string | number) => {
    const updated = [...parsed];
    const transactionToUpdate = { ...updated[index] };

    if (field === 'amount' && typeof value === 'string') {
        const sanitizedValue = value.replace(',', '.');
        transactionToUpdate[field] = parseFloat(sanitizedValue) || 0;
    } else {
        (transactionToUpdate[field] as any) = value;
    }

    if (field === 'type') {
        transactionToUpdate.category = getCategoryFromDescription(transactionToUpdate.description, value as 'income' | 'expense');
    }

    updated[index] = transactionToUpdate;
    setParsed(updated);
};

  const handleClose = () => {
    setText('');
    setParsed([]);
    setStep('paste');
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if(!open) handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 w-[95%] md:w-full md:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>✨ Importar do Nubank/Banco</DialogTitle>
          <DialogDescription>
            {step === 'paste' 
              ? 'Não perca tempo digitando. Vá no site ou app do seu banco, copie a lista de compras e cole aqui.'
              : 'Revise as transações encontradas, ajuste os dados se necessário e confirme a importação.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'paste' && (
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={exampleText}
              className="h-64 font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}
        
        {step === 'preview' && (
          isProcessing ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Categorizando transações...</p>
             </div>
          ) : (
            <div className="mt-4 w-full overflow-y-auto flex-1">
              <div className='w-full overflow-x-auto'>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {parsed.map((p, index) => (
                        <TableRow key={index}>
                            <TableCell className='font-medium whitespace-nowrap'>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                                <Input 
                                    value={p.description} 
                                    onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                    className="h-8 min-w-[150px]"
                                />
                            </TableCell>
                            <TableCell>
                               <Select
                                  value={p.type}
                                  onValueChange={(value: 'income' | 'expense') => handleFieldChange(index, 'type', value)}
                              >
                                  <SelectTrigger className="w-[110px] h-8">
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="expense">
                                          <Badge variant="destructive">Despesa</Badge>
                                      </SelectItem>
                                      <SelectItem value="income">
                                          <Badge variant="default">Receita</Badge>
                                      </SelectItem>
                                  </SelectContent>
                               </Select>
                            </TableCell>
                            <TableCell>
                                <Select 
                                    onValueChange={(value) => handleFieldChange(index, 'category', value)} 
                                    value={p.category}>
                                    <SelectTrigger className="w-[180px] h-8">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories(p.type).map(cat => (
                                            <SelectItem key={cat.label} value={cat.label}>
                                                <div className="flex items-center gap-2">
                                                    <CategoryIcon category={cat.label} className="h-4 w-4" />
                                                    {cat.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-right">
                                <Input 
                                    type="text"
                                    value={String(p.amount).replace('.',',')} 
                                    onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                                    className={`h-8 font-inter font-bold text-right min-w-[100px] ${p.type === 'income' ? 'text-primary' : 'text-foreground'}`}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </div>
            </div>
          )
        )}
        
        <div className='text-xs text-muted-foreground pt-2'>
            Dica: Funciona melhor se você copiar do site do banco no computador (Ctrl+C / Ctrl+V).
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
          {step === 'paste' ? (
            <Button type="button" onClick={handleParseAndCategorize} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fazendo a mágica...</> : '🔮 Fazer a Mágica'}
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={() => setStep('paste')} disabled={isProcessing}>Voltar</Button>
              <Button type="button" onClick={handleConfirmImport} disabled={isProcessing || parsed.length === 0}>
                {isProcessing ? 'Importando...' : `Confirmar Importação (${parsed.length})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
