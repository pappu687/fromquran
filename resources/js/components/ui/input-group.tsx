import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative",
                className
            )}
            {...props}
        />
    )
})
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<
    HTMLInputElement,
    React.ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
})
InputGroupInput.displayName = "InputGroupInput"

const InputGroupAddon = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div"> & {
        align?: "start" | "end" | "inline-end"
    }
>(({ className, align = "start", ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground pointer-events-none",
                align === "start" && "left-3",
                align === "end" && "right-3",
                align === "inline-end" && "right-3",
                className
            )}
            {...props}
        />
    )
})
InputGroupAddon.displayName = "InputGroupAddon"

export { InputGroup, InputGroupInput, InputGroupAddon }
