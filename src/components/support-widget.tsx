'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LifeBuoy, Mail, MessageSquare } from 'lucide-react';

const whatsappNumber = "47996674780"; 
const whatsappMessage = "Olá! Preciso de ajuda com o NeonWallet.";
const supportEmail = "plannerfinanceiro247@gmail.com";

const SupportWidget = () => {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const emailUrl = `mailto:${supportEmail}?subject=Suporte NeonWallet - Dúvida/Bug`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-110 focus:ring-secondary"
          aria-label="Abrir menu de suporte"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-xl mb-2 bg-zinc-900 border-zinc-800" side="top" align="end">
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
    </Popover>
  );
};

export default SupportWidget;
