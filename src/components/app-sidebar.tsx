'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Logo } from './icons/logo';

const AppSidebar = () => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

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
    
    const navItems = [
        { href: '/', icon: Home, label: 'Dashboard' },
        { href: '/dividas', icon: Target, label: 'Dívidas' },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-16 flex-col border-r bg-background">
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
    );
};

export default AppSidebar;
