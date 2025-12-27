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
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { categoriesConfig } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonthDate: Date;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  const Icon = categoriesConfig[category]?.icon;
  return Icon ? <Icon className={className} /> : null;
};

const availableCategories = Object.values(categoriesConfig).filter(cat => cat.type === 'expense');

function parseStatement(text: string, year: number, month: number): ParsedTransaction[] {
  const lines = text.split('\n');
  const transactions: ParsedTransaction[] = [];
  const dateRegex = /(\d{2})\s(\w{3})/; // Regex para "DD MMM"
  const valueRegex = /R\$\s?([\d.,]+)/;

  const monthMap: { [key: string]: number } = {
    JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
    JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  };

  lines.forEach(line => {
    const dateMatch = line.match(dateRegex);
    const valueMatch = line.match(valueRegex);

    if (dateMatch && valueMatch) {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2].toUpperCase();
      const monthIdx = monthMap[monthStr];
      const description = line.replace(dateMatch[0], '').replace(valueMatch[0], '').trim();
      const amount = parseFloat(valueMatch[1].replace(/\./g, '').replace(',', '.'));
      
      const transactionYear = monthIdx > month ? year - 1 : year;
      
      if (!isNaN(day) && monthIdx !== undefined && !isNaN(amount)) {
        transactions.push({
          date: new Date(transactionYear, monthIdx, day).toISOString(),
          description: description || 'Transação Importada',
          amount,
        });
      }
    }
  });

  return transactions;
}

const exampleText = `COMO FUNCIONA: Copie o texto da sua fatura (do app ou do PDF) e cole aqui.
Exemplo:
25 DEZ   PAGAMENTO EM DEBITO - R$ 20,45
24 DEZ   Uber*uber*trip       - R$ 15,00
22 DEZ   IFOOD*IFOOD.COM       - R$ 54,90
`;

export function ImportDialog({ open, onOpenChange, currentMonthDate }: ImportDialogProps) {
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
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const parsedData = parseStatement(text, year, month);
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma transação encontrada', description: 'Verifique o texto colado. O formato esperado é "DD MMM" e "R$ VALOR" na mesma linha.' });
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
        type: 'expense',
        amount: p.amount,
        description: p.description,
        date: p.date,
        category: categoryMap[index] || 'Compras',
        paymentMethod: 'Cartão de Crédito',
        installments: 1,
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
      <DialogContent className="glass-dark border-border/20 max-w-2xl">
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
              className="h-64"
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
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {parsed.map((p, index) => (
                    <TableRow key={index}>
                    <TableCell>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell>
                        <Select onValueChange={(value) => handleCategoryChange(index, value)} defaultValue="Compras">
                            <SelectTrigger className="w-[150px] h-8">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
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
                    </TableCell>
                    <TableCell className="text-right font-inter font-bold">{formatCurrency(p.amount)}</TableCell>
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
