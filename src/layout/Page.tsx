import { cn } from '@/lib/utils';

import type React from 'react';

export default function Page({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <main className={cn('mt-18 mb-12 flex w-full flex-col', className)} {...props}>
      {children}
    </main>
  );
}
