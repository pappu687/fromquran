import * as React from "react"
import { cn } from "@/lib/utils"

const Kbd = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[0.75rem] font-medium text-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-none",
                className
            )}
            {...props}
        />
    )
})
Kbd.displayName = "Kbd"

export { Kbd }
