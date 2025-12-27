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
import { categoriesConfig, categoryKeywords } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2 } from 'lucide-react';
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
    if (!valueStr || typeof valueStr !== 'string') return 0;
    // Remove tudo que não for dígito, vírgula ou sinal de menos
    const cleaned = valueStr.replace(/[^\d,-]/g, '');
    // Substitui a última vírgula por um ponto para o decimal
    const finalStr = cleaned.replace(/,([^,]*)$/, '.$1');
    return parseFloat(finalStr) || 0;
}

// Parser especializado para o formato RAW do extrato
function parseStatement(text: string): Omit<ParsedTransaction, 'category'>[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const transactions: Omit<ParsedTransaction, 'category'>[] = [];
    
    // Regex para capturar data, valor (com ponto decimal) e descrição, ignorando UUID
    const transactionRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(-?\d+\.?\d*)\s+(?:[a-f0-9-]{36}\s+)?(.*)/i;

    lines.forEach(line => {
        const match = line.match(transactionRegex);
        
        if (match) {
            const [_, dateStr, valueStr, rawDescription] = match;
            const description = rawDescription.replace(/compra no débito - /i, '').trim();


            const dateParts = dateStr.split('/');
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);

            // Usa parseFloat diretamente, pois o valor já vem com ponto decimal
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

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerCaseDescription.includes(keyword))) {
            // Garante que a categoria encontrada seja do tipo correto (receita/despesa)
            if (categoriesConfig[category]?.type === type) {
                return category;
            }
        }
    }
    
    // Se for receita e não encontrar, retorna 'Outras Receitas'
    if (type === 'income') {
        return 'Outras Receitas';
    }

    // Se for despesa e não encontrar, retorna 'Outras Despesas'
    return 'Outras Despesas';
}


const exampleText = `COMO FUNCIONA:
Copie o texto da sua fatura ou extrato e cole no campo abaixo. O sistema tentará encontrar transações em diversos formatos.

Exemplos de formatos aceitos:
26/12/2025 -50.23 Uber
26/12/2025 1200.00 Salário Recebido
25/12/2025 -150.99 Supermercado Pão de Açúcar
`;

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

    // Simula um processamento para o spinner aparecer
    await new Promise(resolve => setTimeout(resolve, 500));

    const parsedData = parseStatement(text);
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
      const newTransactions: Transaction[] = parsed.map((p) => ({
        id: uuidv4(),
        userId: user.uid,
        type: p.type,
        amount: p.amount,
        description: p.description,
        date: p.date,
        category: p.category || (p.type === 'income' ? 'Outras Receitas' : 'Outras Despesas'),
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
        transactionToUpdate[field] = parseFloat(value.replace(',', '.')) || 0;
    } else {
        (transactionToUpdate[field] as any) = value;
    }

    // Se o tipo for alterado, recalcula a categoria
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
          </div>
        )}
        
        {step === 'preview' && (
          isProcessing ? (
             <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Categorizando transações...</p>
             </div>
          ) : (
            <>
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
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : <><Wand2 className="mr-2 h-4 w-4" /> Analisar Texto</>}
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
