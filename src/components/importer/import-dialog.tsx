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
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Input } from '../ui/input';


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

// Função de sanitização robusta para valores monetários em formato BRL
function sanitizeCurrency(valueStr: string): number {
    if (!valueStr) return 0;
    // Remove tudo que não for dígito, vírgula ou sinal de menos
    const cleaned = valueStr.replace(/[^\d,-]/g, '');
    // Substitui a última vírgula por um ponto para o decimal
    const finalStr = cleaned.replace(/,([^,]*)$/, '.$1');
    return parseFloat(finalStr);
}

// Parser especializado para o formato RAW do extrato
function parseStatement(text: string): ParsedTransaction[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const transactions: ParsedTransaction[] = [];
    
    // Regex para capturar data, valor (com ponto decimal) e descrição, ignorando UUID
    const transactionRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(-?[\d.]+)\s+(?:[a-f0-9-]{36}\s+)?(.*)/i;

    lines.forEach(line => {
        const match = line.match(transactionRegex);
        
        if (match) {
            const [_, dateStr, valueStr, description] = match;

            const dateParts = dateStr.split('/');
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);

            // Usa parseFloat diretamente, pois o valor já está no formato correto (ex: -21.25)
            const amount = parseFloat(valueStr);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && !isNaN(amount) && description) {
                transactions.push({
                    date: new Date(year, month, day).toISOString(),
                    amount: Math.abs(amount),
                    description: description.trim(),
                    type: amount >= 0 ? 'income' : 'expense',
                    category: '' // A IA preencherá isso
                });
            }
        }
    });

    return transactions;
}


const exampleText = `COMO FUNCIONA:
Copie o texto da sua fatura ou extrato e cole no campo abaixo. O sistema tentará encontrar transações em diversos formatos.

Exemplos de formatos aceitos:
26/12/2025 Uber -50.23
26/12/2025 Salário 1200.00
25/12/2025 Supermercado -150.99
`;

export function ImportDialog({ open, onOpenChange, onConfirm }: ImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedTransaction[]>([]);
  const [step, setStep] = React.useState<'paste' | 'preview'>('paste');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [apiStatus, setApiStatus] = React.useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });


  const handleParseAndCategorize = async () => {
    if (!text) {
      toast({ variant: 'destructive', title: 'Texto vazio', description: 'Por favor, cole o conteúdo do extrato.' });
      return;
    }
    const parsedData = parseStatement(text);
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma transação encontrada', description: 'Verifique o texto colado. O sistema procura por linhas com data, valor e descrição.' });
        return;
    }
    
    setIsProcessing(true);
    setApiStatus({ status: 'idle', message: 'Analisando...' });
    setStep('preview');
    
    try {
        const input: CategorizeTransactionsInput = {
            transactions: parsedData.map(p => ({
                description: p.description,
                amount: p.amount,
                type: p.type,
            }))
        };
        const result = await categorizeTransactions(input);
        
        if (!result || !result.categorizedTransactions) {
            throw new Error("A resposta da API está vazia ou mal formatada.");
        }
        
        const categorizedData = parsedData.map((p, index) => ({
            ...p,
            category: result.categorizedTransactions[index]?.category || (p.type === 'income' ? 'Outras Receitas' : 'Compras')
        }));

        setParsed(categorizedData);
        setApiStatus({ status: 'success', message: 'API Conectada (Chave Válida)' });


    } catch (error: any) {
        console.error("ERRO GIGANTE DA API:", error);
        setApiStatus({ status: 'error', message: `Erro na API: ${error.message}` });
        toast({ variant: 'destructive', title: 'Erro da IA', description: 'Não foi possível categorizar. Ajuste as categorias manualmente.' });
        // Fallback: Se a IA falhar, continua sem as categorias, mas exibe a prévia
        const fallbackData = parsedData.map(p => ({
            ...p,
            category: p.type === 'income' ? 'Outras Receitas' : 'Compras' // Categoria padrão
        }));
        setParsed(fallbackData);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const newTransactions: Transaction[] = parsed.map((p) => ({
        id: uuidv4(),
        userId: user.uid,
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
        category: p.category || (p.type === 'income' ? 'Outras Receitas' : 'Compras'),
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

  const handleFieldChange = (index: number, field: keyof ParsedTransaction, value: string | number) => {
    const updated = [...parsed];
    const transactionToUpdate = { ...updated[index] };

    if (field === 'amount' && typeof value === 'string') {
        transactionToUpdate[field] = parseFloat(value) || 0;
    } else {
        (transactionToUpdate[field] as any) = value;
    }

    updated[index] = transactionToUpdate;
    setParsed(updated);
};


  const handleClose = () => {
    setText('');
    setParsed([]);
    setStep('paste');
    setApiStatus({ status: 'idle', message: '' });
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if(!open) handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const ApiStatusIndicator = () => {
    if (apiStatus.status === 'idle' && !isProcessing) return null;

    let statusMessage = apiStatus.message;
    if (isProcessing) statusMessage = 'Categorizando transações com IA...';

    if (apiStatus.status === 'success' && !isProcessing) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-500 mt-2">
          <CheckCircle className="h-4 w-4" />
          <p>{apiStatus.message}</p>
        </div>
      );
    }

    if (apiStatus.status === 'error' && !isProcessing) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
          <XCircle className="h-4 w-4" />
          <p>{apiStatus.message}</p>
        </div>
      );
    }
    
    return (
       <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>{statusMessage}</p>
        </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/20 max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importador Inteligente (Magic Paste)</DialogTitle>
          <DialogDescription>
            {step === 'paste' 
              ? 'Abra a fatura do seu cartão (ou o extrato bancário) e simplesmente copie e cole o texto das transações aqui.'
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
            <ApiStatusIndicator />
          </div>
        )}
        
        {step === 'preview' && (
          isProcessing ? (
             <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Categorizando transações com IA...</p>
             </div>
          ) : (
            <>
              <ApiStatusIndicator />
              <ScrollArea className="h-[60vh] pr-4 mt-4">
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
                              <TableCell className='font-medium'>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                  <Input 
                                      value={p.description} 
                                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                      className="h-8"
                                  />
                              </TableCell>
                              <TableCell>
                                  <Badge variant={p.type === 'income' ? 'default' : 'destructive'}>
                                      {p.type === 'income' ? 'Receita' : 'Despesa'}
                                  </Badge>
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
                                      type="number"
                                      value={p.amount} 
                                      onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                                      className={`h-8 font-inter font-bold text-right ${p.type === 'income' ? 'text-primary' : 'text-foreground'}`}
                                  />
                              </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              </ScrollArea>
            </>
          )
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
          {step === 'paste' ? (
            <Button type="button" onClick={handleParseAndCategorize} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : 'Analisar Texto'}
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
