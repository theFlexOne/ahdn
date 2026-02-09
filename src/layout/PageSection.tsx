import { cn } from "@/lib/utils";

export default function PageSection({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("p-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}
