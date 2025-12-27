'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Import } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    onImportClick: () => void;
}

const MonthNavigator = ({ currentDate, setCurrentDate }: Pick<HeaderProps, 'currentDate' | 'setCurrentDate'>) => {
    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const formattedDate = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

    return (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg p-1 glass-dark md:w-auto">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <span className="w-40 text-center text-lg font-semibold capitalize tracking-wider">
                {formattedDate}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Próximo mês">
                <ChevronRight className="h-6 w-6" />
            </Button>
        </div>
    );
};


export default function Header({ currentDate, setCurrentDate, onImportClick }: HeaderProps) {
  const displayName = 'Usuário';

  return (
    <header className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex w-full items-center justify-between md:justify-start md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Olá, {displayName}!
            </h1>
        </div>
        
        <div className="flex w-full flex-col md:flex-row md:w-auto md:items-center gap-2">
            <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <Button onClick={onImportClick} variant="outline" className="w-full md:w-auto">
                <Import className="mr-2 h-4 w-4" />
                Importar Extrato
            </Button>
        </div>
    </header>
  );
}