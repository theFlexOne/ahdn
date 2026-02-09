import { cn } from "@/lib/utils";
import type React from "react";

export default function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-5xl bg-white/90 rounded-sm mx-auto flex flex-col gap-20 my-30",
        className
      )}
      {...props}
    >

    </div>
  )
}
