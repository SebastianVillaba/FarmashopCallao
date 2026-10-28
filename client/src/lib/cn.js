import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina clases condicionales resolviendo conflictos de Tailwind
export const cn = (...inputs) => twMerge(clsx(inputs));
