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
import SupportWidget from './support-widget';


const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/dividas', icon: Target, label: 'Dívidas' },
];

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
                        
                        <SupportWidget isButton={true} />

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
                        <SupportWidget isButton={false} />
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
