import { cn } from '@/lib/utils';

export default function PageCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center bg-black/60 p-12 backdrop-blur-[5px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
