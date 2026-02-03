'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import type { InputProps } from '@/components/ui/input';

interface CustomProps {
    onValueChange: (value: string) => void;
    value: string;
}

// This component will now act as a simple text input that cleans itself up on blur.
export const CurrencyInput = React.forwardRef<
    HTMLInputElement,
    Omit<InputProps, 'onChange' | 'value'> & CustomProps
>(({ onValueChange, value, ...props }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow user to type numbers, comma, and dot
        const sanitizedValue = e.target.value.replace(/[^0-9,.]/g, '');
        onValueChange(sanitizedValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (!val) {
            onValueChange('');
            return;
        }
        // Standardize to dot for parsing
        val = val.replace(',', '.');
        const numberValue = parseFloat(val);

        if (!isNaN(numberValue)) {
            // Format to 2 decimal places and use comma for RHF state
            onValueChange(numberValue.toFixed(2).replace('.', ','));
        } else {
            onValueChange(''); // Clear if invalid
        }
    };

    return (
        <Input
            {...props}
            ref={ref}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0,00"
            type="text"
            inputMode="decimal"
        />
    );
});
CurrencyInput.displayName = 'CurrencyInput';
