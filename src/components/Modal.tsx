import { cn } from '@/lib/utils';
import { useEffect, useId, useRef } from 'react';

import type { MouseEvent, ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  closeModal: () => void;
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
};

export function Modal({
  open,
  closeModal,
  title,
  children,
  className = '',
  closeOnBackdropClick = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      closeModal();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [closeModal]);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (!closeOnBackdropClick) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const clickedInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!clickedInside) {
      dialog.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/60 open:flex open:flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 id={titleId} className="text-3xl font-semibold">
          {title || ''}
        </h2>
        <button
          type="button"
          aria-label="Close modal"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white focus:outline-none"
          onClick={() => closeModal()}
        >
          x
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">{children}</div>
    </dialog>
  );
}
