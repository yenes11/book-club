'use client';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BookOpenText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

interface BooksEmptyStateProps {
  selectedMonth: Date | null;
  onAddClick?: () => void;
}

export function BooksEmptyState({
  selectedMonth,
  onAddClick,
}: BooksEmptyStateProps) {
  const message = selectedMonth
    ? `${format(selectedMonth, 'MMMM yyyy', {
        locale: tr,
      })} ayı için kitap bulunamadı.`
    : 'Henüz kitap yok.';

  const title = selectedMonth ? 'Bu Ay İçin Kitap Yok' : 'Henüz Kitap Yok';

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookOpenText />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onAddClick && (
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={onAddClick}>
              <Plus /> Yeni Ekle
            </Button>
          </div>
        </EmptyContent>
      )}
    </Empty>
  );
}
