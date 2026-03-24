import { cn } from '@/lib/utils';

import type React from "react";

export default function Page({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <main
      className={cn(
        "w-full flex flex-col mt-18",
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}
