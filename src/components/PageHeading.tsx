import { cn } from '@/lib/utils';

import type React from 'react';

export default function PageHeading({ children, className, ...props }: React.ComponentProps<'h1'>) {
  return (
    <h1 className={cn('mt-10 text-center font-ahdn text-5xl uppercase', className)} {...props}>
      {children}
    </h1>
  );
}
