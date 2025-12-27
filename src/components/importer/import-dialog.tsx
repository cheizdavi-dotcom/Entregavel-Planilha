'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Transaction, ParsedTransaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';
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
import { formatCurrency } from '@/lib/utils';
import { categoriesConfig } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonthDate: Date;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  const Icon = categoriesConfig[category]?.icon;
  return Icon ? <Icon className={className} /> : null;
};

const availableCategories = (type: 'income' | 'expense') => 
    Object.values(categoriesConfig).filter(cat => cat.type === type);


function parseStatement(text: string): ParsedTransaction[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const transactions: ParsedTransaction[] = [];

    // Regex aprimorado para data DD/MM/YYYY ou DD/MM e valor numérico (incluindo negativos)
    const transactionRegex = /(\d{2}\/\d{2}(?:\/\d{4})?)\s+(-?[\d.,]+(?:,\d{2})?)\s+(.*)/;

    lines.forEach(line => {
        // Tenta um match mais estruturado primeiro
        const match = line.match(transactionRegex);
        if (match) {
            const [_, dateStr, valueStr, description] = match;
            const dateParts = dateStr.split('/');
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = dateParts.length === 3 ? parseInt(dateParts[2], 10) : new Date().getFullYear();
            
            const amount = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));

            if (!isNaN(day) && !isNaN(month) && !isNaN(amount)) {
                transactions.push({
                    date: new Date(year, month, day).toISOString(),
                    amount: Math.abs(amount),
                    description: description.trim() || 'Transação Importada',
                    type: amount >= 0 ? 'income' : 'expense',
                });
            }
        }
    });

    return transactions;
}

const exampleText = `COMO FUNCIONA: Copie o texto da sua fatura (do app ou do PDF) e cole aqui.
O sistema tentará encontrar linhas com data e valor.
Exemplos de formatos aceitos:
26/12/2025 -5.7 Compra no débito - BaitaSuper
26/12/2025 40 Transferência Recebida - Amanda
25 DEZ   PAGAMENTO EM DEBITO - R$ 20,45
`;

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [text, setText] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedTransaction[]>([]);
  const [step, setStep] = React.useState<'paste' | 'preview'>('paste');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [categoryMap, setCategoryMap] = React.useState<Record<number, string>>({});

  const handleParse = () => {
    if (!text) {
      toast({ variant: 'destructive', title: 'Texto vazio', description: 'Por favor, cole o conteúdo do extrato.' });
      return;
    }
    const parsedData = parseStatement(text);
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma transação encontrada', description: 'Verifique o texto colado. O sistema procura por linhas com data e valor.' });
        return;
    }
    setParsed(parsedData);
    setStep('preview');
  };

  const handleConfirmImport = () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const newTransactions: Transaction[] = parsed.map((p, index) => ({
        id: uuidv4(),
        userId: user.uid,
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
        category: categoryMap[index] || (p.type === 'income' ? 'Outras Receitas' : 'Compras'),
        paymentMethod: 'Pix', // Default
      }));

      setTransactions([...transactions, ...newTransactions]);
      toast({ title: 'Sucesso!', description: `${newTransactions.length} transações foram importadas.`, className: 'bg-primary text-primary-foreground' });
      handleClose();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro ao importar', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    setCategoryMap(prev => ({ ...prev, [index]: category }));
  };

  const handleClose = () => {
    setText('');
    setParsed([]);
    setCategoryMap({});
    setStep('paste');
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if(!open) handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importador Inteligente (Magic Paste)</DialogTitle>
          <DialogDescription>
            {step === 'paste' 
              ? 'Abra a fatura do seu cartão (ou o extrato bancário) e simplesmente copie e cole o texto das transações aqui.'
              : 'Revise as transações encontradas, ajuste as categorias se necessário e confirme a importação.'}
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
          <ScrollArea className="h-[50vh] pr-4">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {parsed.map((p, index) => (
                    <TableRow key={index}>
                    <TableCell className='font-medium'>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                        <Badge variant={p.type === 'income' ? 'default' : 'destructive'}>
                            {p.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                    </TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell>
                        <Select 
                            onValueChange={(value) => handleCategoryChange(index, value)} 
                            defaultValue={p.type === 'income' ? 'Outras Receitas' : 'Compras'}>
                            <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="Categoria" />
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
                    <TableCell className={`text-right font-inter font-bold ${p.type === 'income' ? 'text-primary' : 'text-foreground'}`}>
                        {formatCurrency(p.amount)}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </ScrollArea>
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
          {step === 'paste' ? (
            <Button type="button" onClick={handleParse}>Analisar Texto</Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={() => setStep('paste')} disabled={isProcessing}>Voltar</Button>
              <Button type="button" onClick={handleConfirmImport} disabled={isProcessing}>
                {isProcessing ? 'Importando...' : `Confirmar Importação (${parsed.length})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
