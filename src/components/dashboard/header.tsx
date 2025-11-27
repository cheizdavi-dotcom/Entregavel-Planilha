'use client';

import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '../icons/logo';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function getUserInitials(name?: string | null) {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
}


export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <div className="hidden md:block"><Logo /></div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Olá, {displayName}!
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Avatar>
            {user?.photoURL && <AvatarImage src={user.photoURL} alt={displayName} />}
            <AvatarFallback>{getUserInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
        </Button>
      </div>
    </header>
  );
}