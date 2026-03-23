import { cn } from '@/lib/utils';

export default function PageCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full p-12 flex flex-col items-center bg-black/70", className)}
      {...props}
    >
      {children}
    </div>
  )
}
