import { cn } from "@/lib/utils";
import type React from "react";

export default function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <main
      className={cn(
        "bg-lime-500/90 mx-auto flex flex-col gap-20",
        className
      )}
      {...props}
    >

    </main>
  )
}
