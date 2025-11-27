'use client';

import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '../icons/logo';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <div className="hidden md:block"><Logo /></div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Olá, {user?.email?.split('@')[0] || 'Usuário'}!
        </h1>
      </div>
      <Button variant="ghost" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </header>
  );
}
