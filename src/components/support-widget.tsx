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

const whatsappNumber = "5511999999999"; 
const whatsappMessage = "Olá! Preciso de ajuda com o NeonWallet.";
const supportEmail = "plannerfinanceiro247@gmail.com";

const SupportWidget = () => {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const emailUrl = `mailto:${supportEmail}?subject=Suporte NeonWallet - Dúvida/Bug`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-110 focus:ring-secondary"
          aria-label="Abrir menu de suporte"
        >
          <LifeBuoy className="h-7 w-7" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mb-2" side="top" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Precisa de ajuda?</h4>
            <p className="text-sm text-muted-foreground">
              Fale com nosso time.
            </p>
          </div>
          <div className="grid gap-2">
            <Button asChild variant="outline">
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-4 w-4" /> Falar no WhatsApp
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={emailUrl} target="_blank" rel="noopener noreferrer">
                <Mail className="mr-2 h-4 w-4" /> Relatar Bug / Email
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SupportWidget;
