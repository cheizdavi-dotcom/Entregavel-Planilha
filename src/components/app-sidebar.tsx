'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, LogOut, PanelLeft, Database, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Logo } from './icons/logo';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { DataManagerDialog } from './dashboard/data-manager-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Mail, MessageSquare } from 'lucide-react';

const whatsappNumber = "519989760454"; 
const whatsappMessage = "Olá! Preciso de ajuda com o NeonWallet.";
const supportEmail = "plannerfinanceiro247@gmail.com";

const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/dividas', icon: Target, label: 'Dívidas' },
];

const SupportContent = () => {
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    const emailUrl = `mailto:${supportEmail}?subject=Suporte NeonWallet - Dúvida/Bug`;
    return (
        <PopoverContent className="w-72 rounded-xl mb-2 bg-zinc-900 border-zinc-800" side="right" align="start" sideOffset={10}>
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none text-foreground">👋 Precisa de ajuda?</h4>
            <p className="text-sm text-muted-foreground">
              Fale com nosso time.
            </p>
          </div>
          <div className="grid gap-2">
            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className='no-underline'>
                <div className='flex items-center p-3 rounded-lg hover:bg-zinc-800 transition-colors'>
                    <MessageSquare className="mr-3 h-6 w-6 text-green-500" />
                    <div>
                        <p className='font-bold text-foreground'>Atendimento via WhatsApp</p>
                        <p className='text-xs text-muted-foreground'>Resposta rápida</p>
                    </div>
                </div>
            </Link>
              <Link href={emailUrl} target="_blank" rel="noopener noreferrer" className='no-underline'>
                <div className='flex items-center p-3 rounded-lg hover:bg-zinc-800 transition-colors'>
                    <Mail className="mr-3 h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className='font-bold text-foreground'>Relatar um problema</p>
                        <p className='text-xs text-muted-foreground'>Via e-mail</p>
                    </div>
                </div>
            </Link>
          </div>
        </div>
      </PopoverContent>
    );
};


const AppSidebar = () => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isDataManagerOpen, setIsDataManagerOpen] = React.useState(false);

    const handleLogout = async () => {
        if (auth) {
            await auth.signOut();
        }
        router.push('/login');
    };

    function getUserInitials(name?: string | null) {
        if (!name) return 'U';
        const nameParts = name.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    }

    const DesktopSidebar = () => (
        <>
            <aside className="fixed inset-y-0 left-0 z-20 hidden h-full w-16 flex-col border-r bg-background md:flex">
                <div className="border-b p-2">
                    <div className="w-12 h-12 mx-auto">
                        <Logo />
                    </div>
                </div>
                <nav className="grid gap-1 p-2">
                    <TooltipProvider>
                        {navItems.map((item) => (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                                        aria-label={item.label}
                                        className="rounded-lg"
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="size-5" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={5}>
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </nav>
                <nav className="mt-auto grid gap-1 p-2">
                    <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" aria-label="Gerenciar Dados" className="rounded-lg" onClick={() => setIsDataManagerOpen(true)}>
                                    <Database className="size-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}>
                                Backup & Dados
                            </TooltipContent>
                        </Tooltip>
                        
                         <Popover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" aria-label="Ajuda e Suporte" className="rounded-lg">
                                            <LifeBuoy className="size-5" />
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={5}>
                                    Ajuda & Suporte
                                </TooltipContent>
                            </Tooltip>
                            <SupportContent />
                        </Popover>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" aria-label="Sair" className="rounded-lg" onClick={handleLogout}>
                                    <LogOut className="size-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}>
                                Sair
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="mt-2 cursor-pointer h-10 w-10 mx-auto">
                                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                                    <AvatarFallback>{getUserInitials(user?.displayName)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}>
                                {user?.displayName || user?.email}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </nav>
            </aside>
            <DataManagerDialog open={isDataManagerOpen} onOpenChange={setIsDataManagerOpen} />
        </>
    );

    const MobileSidebar = () => (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="md:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    <nav className="grid gap-6 text-lg font-medium">
                         <div className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
                            <Logo />
                            <span className="sr-only">NeonWallet</span>
                        </div>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-2.5 ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setIsSheetOpen(false)}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                     <div className='absolute bottom-4 left-0 w-full px-6 grid gap-6 text-lg font-medium'>
                         <button
                            onClick={() => { setIsDataManagerOpen(true); setIsSheetOpen(false); }}
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                         >
                            <Database className="h-5 w-5" />
                            Backup & Dados
                        </button>
                        
                        <Popover>
                            <PopoverTrigger className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                                <LifeBuoy className="h-5 w-5" />
                                Ajuda / Suporte
                            </PopoverTrigger>
                            <SupportContent />
                        </Popover>

                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="h-5 w-5" />
                            Sair
                        </button>
                     </div>
                </SheetContent>
            </Sheet>
            <DataManagerDialog open={isDataManagerOpen} onOpenChange={setIsDataManagerOpen} />
            <div className='flex items-center gap-2'>
                <span className='font-semibold'>{user?.displayName?.split(' ')[0]}</span>
                 <Avatar className="cursor-pointer h-9 w-9">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>{getUserInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );

    return (
        <>
            <DesktopSidebar />
            <MobileSidebar />
        </>
    );
};

export default AppSidebar;
