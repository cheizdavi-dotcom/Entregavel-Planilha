import { Briefcase, GraduationCap, Utensils, Home, Car, PartyPopper, HeartPulse, Landmark, PiggyBank } from 'lucide-react';

export type Category = {
    label: string;
    icon: React.ComponentType<any>;
    type: 'income' | 'expense';
    type503020?: 'needs' | 'wants' | 'savings';
};

export const categoriesConfig: { [key: string]: Category } = {
    // Income
    'Salário': { label: 'Salário', icon: Briefcase, type: 'income' },
    'Freelance': { label: 'Freelance', icon: Briefcase, type: 'income' },
    'Investimentos': { label: 'Investimentos', icon: Landmark, type: 'income' },
    
    // Expenses
    'Alimentação': { label: 'Alimentação', icon: Utensils, type: 'expense', type503020: 'needs' },
    'Moradia': { label: 'Moradia', icon: Home, type: 'expense', type503020: 'needs' },
    'Transporte': { label: 'Transporte', icon: Car, type: 'expense', type503020: 'needs' },
    'Saúde': { label: 'Saúde', icon: HeartPulse, type: 'expense', type503020: 'needs' },
    'Educação': { label: 'Educação', icon: GraduationCap, type: 'expense', type503020: 'needs' },
    'Lazer': { label: 'Lazer', icon: PartyPopper, type: 'expense', type503020: 'wants' },
    'Dívidas': { label: 'Dívidas', icon: Landmark, type: 'expense', type503020: 'savings' },
    'Poupança': { label: 'Poupança', icon: PiggyBank, type: 'expense', type503020: 'savings' },
};
