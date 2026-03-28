import { cn } from '@/lib/utils';

import type React from 'react';

export default function Page({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <main
      className={cn('relative mt-18 mb-12 flex w-full flex-col items-center gap-10', className)}
      {...props}
    >
      {children}
    </main>
  );
}
