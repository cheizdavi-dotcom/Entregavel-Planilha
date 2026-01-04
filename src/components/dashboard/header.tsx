'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Import, LogOut, Trash2, LifeBuoy } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


interface HeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    onImportClick: () => void;
    onResetData: () => void;
}

const MonthNavigator = ({ currentDate, setCurrentDate }: Pick<HeaderProps, 'currentDate' | 'setCurrentDate'>) => {
    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const formattedDate = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

    return (
        <div className="flex w-full items-center justify-center gap-1 rounded-lg p-1 glass-dark md:w-auto">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <span className="w-32 md:w-40 text-center text-base md:text-lg font-semibold capitalize tracking-wider">
                {formattedDate}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Próximo mês">
                <ChevronRight className="h-6 w-6" />
            </Button>
        </div>
    );
};

const UserMenu = ({ onResetData }: { onResetData: () => void }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleLogout = async () => {
        if (auth) {
            await auth.signOut();
        }
        router.push('/login');
    };

    const handleReset = () => {
        onResetData();
        setIsAlertOpen(false);
    }
    
    function getUserInitials(name?: string | null) {
        if (!name) return 'U';
        const nameParts = name.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    }

    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                         <Avatar className="h-10 w-10">
                            {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                            <AvatarFallback>{getUserInitials(user?.displayName)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <a href="mailto:plannerfinanceiro247@gmail.com" className="w-full">
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>Suporte</span>
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Resetar Dados</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso apagará permanentemente todas as suas
                    transações, metas e dívidas. Seus dados serão perdidos para sempre.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Reset</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function Header({ currentDate, setCurrentDate, onImportClick, onResetData }: HeaderProps) {
  const { user } = useAuth();
  const displayName = user?.displayName?.split(' ')[0] || 'Usuário';

  return (
    <header className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Olá, {displayName}!
            </h1>
            <div className='md:hidden'>
                <UserMenu onResetData={onResetData} />
            </div>
        </div>
        
        <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:flex-row md:w-auto md:items-center">
            <Button onClick={onImportClick} variant="outline" className="w-full sm:w-auto">
                <Import className="mr-2 h-4 w-4" />
                Importar
            </Button>
            <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <div className='hidden md:block'>
                <UserMenu onResetData={onResetData} />
            </div>
        </div>
    </header>
  );
}
