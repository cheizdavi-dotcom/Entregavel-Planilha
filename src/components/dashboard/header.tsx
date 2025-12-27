'use client';

import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from '../icons/logo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getUserInitials(name?: string | null) {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}

interface HeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

const MonthNavigator = ({ currentDate, setCurrentDate }: HeaderProps) => {
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


export default function Header({ currentDate, setCurrentDate }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
    }
    router.push('/login');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex w-full items-center justify-between md:justify-start md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Olá, {displayName}!
        </h1>
      </div>
      
      <div className="w-full md:w-auto">
        <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
      </div>
    </header>
  );
}
