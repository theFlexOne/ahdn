import { cn } from '@/lib/utils';

type DateBadgeProps = {
  date: Date;
  className?: string;
  monthClassName?: string;
  dayClassName?: string;
  timeClassName?: string;
};

export function DateBadge({
  date,
  className,
  monthClassName,
  dayClassName,
  timeClassName,
}: DateBadgeProps) {
  return (
    <div className={cn('text-center leading-none', className)}>
      <div className={cn('text-xs tracking-widest', monthClassName)}>
        {formatMonth(date).toUpperCase()}
      </div>

      <div className={cn('text-3xl font-bold text-red-800', dayClassName)}>{formatDay(date)}</div>

      <div className={cn('text-sm', timeClassName)}>{formatTime(date).toLowerCase()}</div>
    </div>
  );
}

function formatMonth(dateTime: Date) {
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
  });
  return monthFormatter.format(dateTime);
}

function formatDay(dateTime: Date) {
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
  });
  return dayFormatter.format(dateTime);
}

function formatTime(dateTime: Date) {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return timeFormatter.format(dateTime);
}
