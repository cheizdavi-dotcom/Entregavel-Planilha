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
        <div className="flex items-center gap-2 rounded-lg p-1">
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
    await auth.signOut();
    router.push('/login');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4">
       <div className="flex items-center gap-4 self-start">
        <div className="hidden md:block"><Logo /></div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Olá, {displayName}!
        </h1>
      </div>

      <div className='flex items-center gap-4'>
        <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
        <div className="hidden md:flex items-center gap-4">
            <Avatar>
                {user?.photoURL && <AvatarImage src={user.photoURL} alt={displayName} />}
                <AvatarFallback>{getUserInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        </div>
      </div>
    </header>
  );
}
