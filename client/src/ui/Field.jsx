import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

const base = 'w-full rounded-xl border bg-white px-4 text-[15px] text-ink-900 transition placeholder:text-ink-400 focus:outline-none focus:ring-4';
const estado = (error) => error
  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
  : 'border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-brand-100';

// Envoltorio con label y mensaje de error
export function Field({ label, error, hint, id, required, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-700">
          {label}{required && <span className="text-brand-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, inputClassName, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required} className={className}>
      <input ref={ref} id={id} aria-invalid={!!error} className={cn(base, 'h-12', estado(error), inputClassName)} {...props} />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required} className={className}>
      <textarea ref={ref} id={id} rows={3} aria-invalid={!!error} className={cn(base, 'resize-none py-3', estado(error))} {...props} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, required, className, children, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} id={id} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn(base, 'h-12 cursor-pointer appearance-none pr-10', estado(error))}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-ink-500" />
      </div>
    </Field>
  );
});
