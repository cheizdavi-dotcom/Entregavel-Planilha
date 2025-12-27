'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
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
import { categorizeTransactions, type CategorizeTransactionsInput } from '@/ai/flows/categorize-transactions-flow';
import { Loader2 } from 'lucide-react';


interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newTransactions: Transaction[]) => void;
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

    const transactionRegex = /(\d{2}\/\d{2}(?:\/\d{4})?)\s+(-?[\d.,]+(?:,\d{2})?)\s+(.*)/;
    const oldTransactionRegex = /(\d{1,2} [A-Z]{3})\s+(.*?)\s+-\s+R\$\s*([\d,]+\.\d{2})/;


    lines.forEach(line => {
        const match = line.match(transactionRegex);
        const oldMatch = line.match(oldTransactionRegex);

        if (match) {
            const [_, dateStr, valueStr, description] = match;
            const dateParts = dateStr.split('/');
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            let year = dateParts.length === 3 ? parseInt(dateParts[2], 10) : new Date().getFullYear();
            if (year < 2000) year += 2000;
            
            const amount = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));

            if (!isNaN(day) && !isNaN(month) && !isNaN(amount)) {
                transactions.push({
                    date: new Date(year, month, day).toISOString(),
                    amount: Math.abs(amount),
                    description: description.trim() || 'Transação Importada',
                    type: amount >= 0 ? 'income' : 'expense',
                    category: '' // Deixa em branco para a IA preencher
                });
            }
        } else if (oldMatch) {
            // Lógica para o formato antigo, se necessário
        }
    });

    return transactions;
}

const exampleText = `COMO FUNCIONA:
Copie o texto da sua fatura ou extrato (do app do seu banco ou do PDF) e cole no campo abaixo.
O sistema tentará encontrar transações em diversos formatos.

Exemplos de formatos aceitos:
26/12/2025 -15,50 Compra no débito - Supermercado
26/12/2025 1200,00 Transferência Recebida de PIX
25 DEZ   PAGAMENTO EM DEBITO - UBER TRIP - R$ 20,45
`;

export function ImportDialog({ open, onOpenChange, onConfirm }: ImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedTransaction[]>([]);
  const [step, setStep] = React.useState<'paste' | 'preview'>('paste');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [categoryMap, setCategoryMap] = React.useState<Record<number, string>>({});

  const handleParseAndCategorize = async () => {
    if (!text) {
      toast({ variant: 'destructive', title: 'Texto vazio', description: 'Por favor, cole o conteúdo do extrato.' });
      return;
    }
    const parsedData = parseStatement(text);
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma transação encontrada', description: 'Verifique o texto colado. O sistema procura por linhas com data e valor.' });
        return;
    }
    
    setIsProcessing(true);
    setStep('preview'); // Muda para a tela de preview pra mostrar o loading
    
    try {
        const input: CategorizeTransactionsInput = {
            transactions: parsedData.map(p => ({
                description: p.description,
                amount: p.amount,
                type: p.type,
            }))
        };
        const result = await categorizeTransactions(input);
        
        const categorizedData = parsedData.map((p, index) => ({
            ...p,
            category: result.categorizedTransactions[index]?.category || ''
        }));

        setParsed(categorizedData);

        const initialCategoryMap = categorizedData.reduce((acc, p, index) => {
            acc[index] = p.category;
            return acc;
        }, {} as Record<number, string>);
        setCategoryMap(initialCategoryMap);

    } catch (error: any) {
        console.error("AI Categorization Error:", error);
        toast({ variant: 'destructive', title: 'Erro da IA', description: 'Ocorreu um erro ao categorizar as transações. Verifique as categorias manualmente.' });
        // Se a IA falhar, continua sem as categorias
        setParsed(parsedData);
    } finally {
        setIsProcessing(false);
    }
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
      
      onConfirm(newTransactions);

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
          isProcessing ? (
             <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Categorizando transações com IA...</p>
             </div>
          ) : (
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
                                value={categoryMap[index]}>
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
                        <TableCell className={`text-right font-inter font-bold ${p.type === 'income' ? 'text-primary' : 'text-foreground'}`}>
                            {formatCurrency(p.amount)}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
          )
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
          {step === 'paste' ? (
            <Button type="button" onClick={handleParseAndCategorize}>Analisar Texto</Button>
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
