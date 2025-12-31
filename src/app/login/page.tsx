'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
import { Logo } from '@/components/icons/logo';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'A configuração do Firebase está ausente. Verifique o arquivo firebase-config.ts',
      });
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Firebase Auth Error:', error);
      let description = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'E-mail ou senha inválidos. Por favor, verifique e tente novamente.'
      } else if (error.code === 'auth/api-key-not-valid') {
        description = 'Chave de API do Firebase inválida. Verifique sua configuração.'
      }
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: description,
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
          <CardTitle className="text-2xl font-bold">Bem-vindo!</CardTitle>
          <CardDescription>
            Use seu e-mail e senha para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
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
