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
  // This function formats a raw string of digits into a BRL currency string for display
  const formatForDisplay = (val: string | undefined): string => {
    if (!val) return '';
    // 1. Keep only digits from the value provided by react-hook-form (which might be "1234,56")
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly === '') return '';

    // 2. Convert to a number (as cents) and then to a float
    const numberValue = parseFloat(digitsOnly) / 100;

    // 3. Format as BRL currency string (e.g., "1.234,56")
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);
  };
  
  // The value prop comes from react-hook-form (e.g., "1234,56")
  // We format it for display (e.g., "1.234,56")
  const displayValue = formatForDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When the user types, we get the raw value (e.g., "1.234,5a6")
    const rawValue = e.target.value;
    // We keep only the digits
    const digitsOnly = rawValue.replace(/\D/g, '');

    // We create the value that will be stored in the form state (e.g., "1234,56")
    // This format is compatible with the existing zod schema and submission logic
    const formValue = (parseFloat(digitsOnly || '0') / 100).toFixed(2).replace('.', ',');
    
    // We call react-hook-form's onChange to update the form state
    onValueChange(formValue);
  };

  return (
    <Input
      {...props}
      ref={ref}
      value={displayValue}
      onChange={handleChange}
      type="text"
      inputMode="decimal"
    />
  );
});
CurrencyInput.displayName = 'CurrencyInput';
