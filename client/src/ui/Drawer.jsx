import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

// Panel lateral accesible (foco atrapado, Escape para cerrar, bloqueo de scroll)
export default function Drawer({ open, onOpenChange, side = 'right', title, description, footer, className, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-white shadow-pop focus:outline-none',
            side === 'right' ? 'right-0 data-[state=open]:animate-slide-in-right' : 'left-0 data-[state=open]:animate-slide-in-left',
            className
          )}
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <Dialog.Title className="font-display text-lg font-bold text-ink-900">{title}</Dialog.Title>
            <Dialog.Close className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{description || title}</Dialog.Description>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-ink-100 p-5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
