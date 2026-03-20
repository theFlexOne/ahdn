import { cn } from "@/lib/utils";
import type React from "react";

export default function Page({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <main
      className={cn(
        "w-full flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}
