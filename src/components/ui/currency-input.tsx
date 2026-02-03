'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import type { InputProps } from '@/components/ui/input';

interface CustomProps {
    onValueChange: (value: string) => void;
    value: string;
}

export const CurrencyInput = React.forwardRef<
    HTMLInputElement,
    Omit<InputProps, 'onChange' | 'value'> & CustomProps
>(({ onValueChange, value, ...props }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;
        const digitsOnly = inputValue.replace(/\D/g, '');
        
        if (!digitsOnly) {
            onValueChange('');
            return;
        }
        
        const numericString = (parseFloat(digitsOnly) / 100).toFixed(2);
        onValueChange(numericString.replace('.', ','));
    };

    const formatForDisplay = (val: string): string => {
        if (!val) return '';
        
        const numberValue = parseFloat(val.replace(',', '.'));
        if (isNaN(numberValue)) return '';
        
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numberValue);
    };

    return (
        <Input
            {...props}
            ref={ref}
            value={formatForDisplay(value) || ''}
            onChange={handleChange}
            placeholder="0,00"
            type="text"
            inputMode="decimal"
        />
    );
});
CurrencyInput.displayName = 'CurrencyInput';
