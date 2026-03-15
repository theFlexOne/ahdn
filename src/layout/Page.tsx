import { cn } from "@/lib/utils";
import type React from "react";

export default function Page({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full flex-col gap-20 bg-lime-500/90",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
