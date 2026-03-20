import { cn } from "@/lib/utils";

export default function PageSection({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full p-4 flex flex-col items-center bg-black/70", className)}
      {...props}
    >
      <section className="w-full max-w-5xl">
        {children}
      </section>
    </div>
  )
}
