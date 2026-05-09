"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type HintConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function HintConfirmDialog({ open, onOpenChange, onConfirm }: HintConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] p-4">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
            <Lightbulb className="h-5 w-5" />
          </div>
          <DialogTitle>Pokazać podpowiedź?</DialogTitle>
          <DialogDescription>
            Po użyciu podpowiedzi za to pytanie można zdobyć maksymalnie 0,75 punktu zamiast 1 punktu.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
          <div className="mb-1 flex items-center gap-2 font-semibold text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Podpowiedź zapisuje się na stałe
          </div>
          <p>Jeśli chcesz walczyć o pełny punkt, spróbuj jeszcze wyciągnąć trop z rozmowy.</p>
        </div>

        <div className="grid gap-2 min-[430px]:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Jeszcze nie
          </Button>
          <Button type="button" onClick={onConfirm}>
            Pokaż podpowiedź
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
