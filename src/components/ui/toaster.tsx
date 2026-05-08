"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "border border-border bg-popover text-popover-foreground shadow-xl",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
        },
      }}
    />
  );
}
