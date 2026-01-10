'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Book } from '@/lib/supabase';

interface BookActionsProps {
  book: Book;
  onDelete: (book: Book) => void;
}

export function BookActions({ book, onDelete }: BookActionsProps) {
  return (
    <div className="flex gap-2 justify-end w-full">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(book)}
        className="size-10 cursor-pointer rounded-full"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

