import { Briefcase, GraduationCap, Utensils, Home, Car, PartyPopper, HeartPulse, Landmark, PiggyBank, ShoppingBag, LandmarkIcon, ArrowLeftRight } from 'lucide-react';

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
    'Outras Receitas': { label: 'Outras Receitas', icon: PiggyBank, type: 'income' },

    // Expenses -> Needs
    'Moradia': { label: 'Moradia', icon: Home, type: 'expense', type503020: 'needs' },
    'Alimentação': { label: 'Alimentação', icon: Utensils, type: 'expense', type503020: 'needs' },
    'Transporte': { label: 'Transporte', icon: Car, type: 'expense', type503020: 'needs' },
    'Saúde': { label: 'Saúde', icon: HeartPulse, type: 'expense', type503020: 'needs' },
    'Educação': { label: 'Educação', icon: GraduationCap, type: 'expense', type503020: 'needs' },

    // Expenses -> Wants
    'Lazer': { label: 'Lazer', icon: PartyPopper, type: 'expense', type503020: 'wants' },
    'Compras': { label: 'Compras', icon: ShoppingBag, type: 'expense', type503020: 'wants' },
    'Outras Despesas': { label: 'Outras Despesas', icon: ShoppingBag, type: 'expense', type503020: 'wants' },
    
    // Expenses -> Savings/Debts
    'Dívidas': { label: 'Dívidas', icon: LandmarkIcon, type: 'expense', type503020: 'savings' },
    'Poupança': { label: 'Poupança', icon: PiggyBank, type: 'expense', type503020: 'savings' },
    'Investimento': { label: 'Investimento', icon: Briefcase, type: 'expense', type503020: 'savings' },
    'Transferências': { label: 'Transferências', icon: ArrowLeftRight, type: 'expense', type503020: 'savings' },
};

export const categoryKeywords: { [key: string]: string[] } = {
    'Transporte': ['uber', '99', 'taxi', 'posto', 'combust', 'ipiranga', 'shell', 'petro', 'estac', 'pedagio', 'sem parar', 'veloe', 'passagem', 'viacao'],
    'Alimentação': ['ifood', 'rappi', 'z-tech', 'food', 'burger', 'pizza', 'sushi', 'restaurante', 'padaria', 'confeitaria', 'cafe', 'bistro', 'super', 'merca', 'atacad', 'assai', 'carrefour', 'pao de acucar', 'extra', 'horti'],
    'Saúde': ['farma', 'droga', 'medic', 'hosp', 'clinica', 'lab', 'doctor', 'saude', 'unimed', 'plano de saude'],
    'Lazer': ['netflix', 'spotify', 'amazon', 'prime', 'hbo', 'disney', 'steam', 'playstation', 'xbox', 'nintendo', 'cinema', 'ingresso', 'sympla', 'eventim', 'show', 'bar', 'festa'],
    'Moradia': ['luz', 'energia', 'agua', 'saneamento', 'claro', 'vivo', 'tim', 'oi', 'internet', 'condominio', 'aluguel', 'iptu', 'leroy', 'merlin'],
    'Educação': ['udemy', 'curso', 'faculdade', 'escola', 'livraria'],
    'Compras': ['roupa', 'vestuario', 'calcado', 'loja', 'shop', 'magazine', 'luiza', 'amazon', 'mercado livre'],
    'Transferências': ['pix', 'transf', 'ted', 'doc', 'pagamento', 'boleto'],
};
