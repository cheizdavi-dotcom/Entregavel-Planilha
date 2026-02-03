'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DataManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataManagerDialog({ open, onOpenChange }: DataManagerDialogProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [isImportAlertOpen, setImportAlertOpen] = React.useState(false);

  const handleExport = () => {
    try {
      const data: { [key: string]: any } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('transactions_') || key.startsWith('goals_') || key.startsWith('debts_'))) {
          data[key] = JSON.parse(localStorage.getItem(key) || 'null');
        }
      }

      if (Object.keys(data).length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum dado para exportar',
          description: 'Não foram encontrados dados de transações, metas ou dívidas para fazer o backup.',
        });
        return;
      }
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `neon-wallet-backup-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação Concluída',
        description: 'Seu backup foi baixado com sucesso.',
        className: 'bg-primary text-primary-foreground',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Export Error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro na Exportação',
        description: 'Não foi possível gerar o arquivo de backup.',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setPendingFile(file);
      setImportAlertOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Arquivo Inválido',
        description: 'Por favor, selecione um arquivo de backup .json válido.',
      });
    }
    // Reset file input to allow selecting the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleImportConfirm = () => {
    if (!pendingFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("Falha ao ler o conteúdo do arquivo.");
        }
        const data = JSON.parse(text);

        // Clear existing app data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('transactions_') || key.startsWith('goals_') || key.startsWith('debts_')) {
                localStorage.removeItem(key);
            }
        });

        // Import new data
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }

        toast({
          title: 'Importação Concluída!',
          description: 'Seus dados foram restaurados. A página será recarregada.',
        });

        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error("Import Error:", error);
        toast({
          variant: 'destructive',
          title: 'Erro na Importação',
          description: 'O arquivo de backup está corrompido ou em formato inválido.',
        });
      } finally {
        setPendingFile(null);
        setImportAlertOpen(false);
      }
    };

    reader.readAsText(pendingFile);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl glass-dark border-border/20">
          <DialogHeader>
            <DialogTitle>Gerenciar Dados</DialogTitle>
            <DialogDescription>
              Seus dados são armazenados localmente no seu dispositivo. Faça backups regulares.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm space-y-2">
            <h4 className='font-bold text-foreground'>Como funciona:</h4>
            <ul className='list-disc list-inside space-y-1'>
                <li>Seus dados ficam salvos apenas neste navegador.</li>
                <li>Clique em 'Salvar' pelo menos uma vez por semana.</li>
                <li>Se trocar de dispositivo ou limpar o histórico, use o 'Recuperar' para trazer tudo de volta.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div onClick={handleExport} className="h-auto cursor-pointer rounded-lg border bg-transparent p-4 text-center transition-colors hover:bg-accent flex flex-col items-center justify-start gap-2">
                <Download className="h-8 w-8 text-primary" />
                <span className="text-base font-semibold">💾 Salvar Meus Dados</span>
                <span className="text-xs font-normal text-muted-foreground">
                    Baixa um arquivo seguro para o seu computador/celular.
                </span>
             </div>
             <div onClick={handleImportClick} className="h-auto cursor-pointer rounded-lg border bg-transparent p-4 text-center transition-colors hover:bg-accent flex flex-col items-center justify-start gap-2">
                <Upload className="h-8 w-8 text-secondary" />
                <span className="text-base font-semibold">📂 Recuperar Meus Dados</span>
                <span className="text-xs font-normal text-muted-foreground">
                    Lê um arquivo de backup salvo anteriormente.
                </span>
             </div>
             <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileSelected}
                className="hidden"
            />
          </div>

          <DialogFooter className='sm:justify-end mt-4'>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isImportAlertOpen} onOpenChange={setImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção! Esta ação substituirá TODOS os dados atuais do aplicativo pelos dados do arquivo de backup. 
              Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFile(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm} className="bg-destructive hover:bg-destructive/90">
              Confirmar e Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
