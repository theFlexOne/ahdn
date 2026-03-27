import { cn } from '@/lib/utils';

export default function Button({ className, children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'py-2 px-4 border rounded-sm cursor-pointer hover:bg-current/30  transition-colors duration-200 ease-in-out',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
