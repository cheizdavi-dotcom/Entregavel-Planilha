'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons/logo';

const GoogleIcon = () => (
  <svg
    className="mr-2 h-5 w-5"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.3 111.8 11.8 244 11.8c70.3 0 129.8 28.7 174.4 72.7l-69.2 67.3c-24.5-23.2-57.3-37.3-95.2-37.3-71.3 0-129.5 58.2-129.5 129.5s58.2 129.5 129.5 129.5c82.3 0 117-57.3 122.5-87.5H244v-83.3h237.9c2.3 12.7 3.6 26.1 3.6 40.2z"
    ></path>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'A configuração do Firebase está ausente.',
      });
      return;
    }
    setLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('Firebase Auth Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Algo deu errado.',
        description: error.message || 'Não foi possível entrar com o Google.',
      });
      setLoadingGoogle(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'A configuração do Firebase está ausente.',
      });
      return;
    }
    setLoadingEmail(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Firebase Auth Error:', error);
      let description = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'E-mail ou senha inválidos. Por favor, tente novamente.'
      }
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: description,
      });
    } finally {
        setLoadingEmail(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm glass-dark">
        <CardHeader className="space-y-2 text-center">
          <div className="inline-block mx-auto">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo!</CardTitle>
          <CardDescription>
            Entre com sua conta Google ou use seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-12 text-lg font-semibold glass-dark border-primary/50 hover:border-primary hover:bg-primary/10 transition-all duration-300"
            disabled={loadingGoogle || loadingEmail}
            variant="outline"
          >
            {loadingGoogle ? (
              'Redirecionando...'
            ) : (
              <>
                <GoogleIcon /> Entrar com Google
              </>
            )}
          </Button>
          
          <div className="relative my-4">
            <Separator />
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingGoogle || loadingEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingGoogle || loadingEmail}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loadingGoogle || loadingEmail}>
              {loadingEmail ? "Entrando..." : "Entrar com E-mail"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              Cadastre-se
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
