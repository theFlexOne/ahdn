import { cn } from '@/lib/utils';

export default function Button({ className, children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'cursor-pointer rounded-sm border px-4 py-2 transition-colors duration-200 ease-in-out hover:bg-current/30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
