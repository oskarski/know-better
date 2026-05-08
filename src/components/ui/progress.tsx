import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
};

function Progress({ value, className, ...props }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-white/10", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      {...props}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-amber-300 to-accent transition-all duration-500 ease-out"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
