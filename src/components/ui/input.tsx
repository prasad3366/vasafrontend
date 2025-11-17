import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, defaultValue, ...props }, ref) => {
    // Only pass `value` when an explicit `value` prop is provided. This preserves
    // the uncontrolled behavior for callers that expect it (no onChange), and
    // avoids making every Input read-only.
    // If a caller passed `defaultValue`, forward it as defaultValue.
    const inputProps: any = {};
    if (value !== undefined) {
      // Caller intends a controlled input; pass the value (ensure it's defined to avoid
      // uncontrolled -> controlled transitions elsewhere).
      inputProps.value = value ?? "";
    } else if (defaultValue !== undefined) {
      inputProps.defaultValue = defaultValue;
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...inputProps}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
