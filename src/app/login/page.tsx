'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';

const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.3 111.8 11.8 244 11.8c70.3 0 129.8 28.7 174.4 72.7l-69.2 67.3c-24.5-23.2-57.3-37.3-95.2-37.3-71.3 0-129.5 58.2-129.5 129.5s58.2 129.5 129.5 129.5c82.3 0 117-57.3 122.5-87.5H244v-83.3h237.9c2.3 12.7 3.6 26.1 3.6 40.2z"></path>
    </svg>
  );

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Erro de Configuração',
            description: 'A configuração do Firebase está ausente. Verifique o console para mais detalhes.',
        });
        return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Algo deu errado.',
        description: error.message || 'Não foi possível entrar com o Google.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm glass-dark">
        <CardHeader className="space-y-2 text-center">
            <div className="inline-block mx-auto">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta!</CardTitle>
          <CardDescription>Clique abaixo para entrar com sua conta Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button 
                onClick={handleGoogleSignIn} 
                className="w-full h-12 text-lg font-semibold glass-dark border-primary/50 hover:border-primary hover:bg-primary/10 transition-all duration-300" 
                disabled={loading}
                variant="outline"
            >
               {loading ? 'Entrando...' : <><GoogleIcon /> Entrar com Google</>}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
