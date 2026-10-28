import { cn } from '../lib/cn';

const VARIANTES = {
  primary: 'bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800',
  outline: 'border border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:text-brand-600',
  ghost: 'text-ink-700 hover:bg-ink-100',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  whatsapp: 'bg-[#25d366] text-white hover:bg-[#1fb857]',
};

const TAMANOS = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'h-10 w-10',
};

export const buttonClasses = ({ variant = 'primary', size = 'md', className } = {}) => cn(
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold transition-all duration-150 select-none',
  'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  VARIANTES[variant],
  TAMANOS[size],
  className
);

export default function Button({ variant, size, className, type = 'button', ...props }) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
