import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type TagsInputTagProps = {
  tag: string;
  className?: string;
  onRemove?: () => void;
};

export function TagsInputTag({ tag, className, onRemove }: TagsInputTagProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-sm border px-2 py-1 text-sm',
        onRemove && 'relative pr-6',
        className,
      )}
    >
      <span className="truncate">{tag}</span>

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${tag}`}
          onClick={onRemove}
          className={cn(
            'text-muted-foreground absolute top-1/2 right-2 inline-flex h-3 w-3 -translate-y-1/2 items-center justify-center',
            'cursor-pointer transition-colors duration-150 ease-out hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
          )}
        >
          <X className="h-full w-full" />
        </button>
      ) : null}
    </span>
  );
}
