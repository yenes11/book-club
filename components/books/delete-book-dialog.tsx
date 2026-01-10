'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookName: string | null;
  onConfirm: () => void;
}

export function DeleteBookDialog({
  open,
  onOpenChange,
  bookName,
  onConfirm,
}: DeleteBookDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kitabı Sil</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{bookName}</span> adlı kitabı
            silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

