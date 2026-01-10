'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getMonthKey } from '@/lib/book-utils';
import type { Book } from '@/lib/supabase';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  books: Book[];
}

/**
 * Kitapları aylara göre gruplayan ve filtreleyen hook
 */
export function useBooksByMonth(
  books: Book[],
  selectedMonth: Date | null
): MonthGroup[] {
  const booksByMonth = useMemo(() => {
    const grouped: Record<string, Book[]> = {};
    books.forEach((book) => {
      const monthKey = getMonthKey(book.created_at);
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(book);
    });

    // Ayları sırala (en yeni önce)
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
      return b.localeCompare(a);
    });

    return sortedMonths.map((monthKey) => {
      const date = new Date(monthKey + '-01');
      return {
        monthKey,
        monthLabel: format(date, 'MMMM yyyy', { locale: tr }),
        books: grouped[monthKey],
      };
    });
  }, [books]);

  const filteredBooksByMonth = useMemo(() => {
    if (!selectedMonth) return booksByMonth;
    const selectedMonthKey = getMonthKey(selectedMonth.toISOString());
    return booksByMonth.filter((item) => item.monthKey === selectedMonthKey);
  }, [booksByMonth, selectedMonth]);

  return filteredBooksByMonth;
}

