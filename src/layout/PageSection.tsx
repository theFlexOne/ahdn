import { cn } from '@/lib/utils';

export default function PageSection({
  className,
  children,
  ...props
}: React.ComponentProps<'section'>) {
  return (
    <section className={cn('w-full max-w-5xl', className)} {...props}>
      {children}
    </section>
  );
}
