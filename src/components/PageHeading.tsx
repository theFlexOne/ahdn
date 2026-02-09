import { cn } from "@/lib/utils";
import type React from "react";

export default function PageHeading({ children, className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("font-gl text-5xl self-start pt-4 pl-4", className)}
      {...props}
    >
      {children}
    </h1>
  )
}
