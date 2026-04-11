import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import type { ComponentProps } from "react"

function Spinner({
  className,
  strokeWidth = 2,
  ...props
}: Omit<ComponentProps<"svg">, "strokeWidth"> & {
  strokeWidth?: number
}) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={strokeWidth}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
