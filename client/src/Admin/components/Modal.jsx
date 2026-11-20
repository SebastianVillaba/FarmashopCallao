import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

// Diálogo centrado (foco atrapado, Escape para cerrar)
export default function Modal({ open, onOpenChange, title, description, className, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-pop focus:outline-none data-[state=open]:animate-fade-in',
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
