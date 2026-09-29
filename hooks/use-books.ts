'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Book } from '@/lib/types';
import {
  getBooks,
  deleteBook as deleteBookAction,
  deleteAllBooks as deleteAllBooksAction,
  moveBooksToDate,
} from '@/lib/actions/books';

/**
 * Kitapları yükleme ve yönetme hook'u
 */
export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setBooks(await getBooks());
    } catch (error) {
      console.error('Error fetching books:', error);
      alert(`Veri yükleme hatası: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const deleteBook = useCallback(async (id: number) => {
    try {
      await deleteBookAction(id);
      setBooks((prevBooks) => prevBooks.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }, []);

  const deleteAllBooks = useCallback(async () => {
    try {
      await deleteAllBooksAction();
      setBooks([]);
    } catch (error) {
      console.error('Error deleting all books:', error);
      throw error;
    }
  }, []);

  const updateVoteCount = useCallback((bookId: number, newVoteCount: number) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) =>
        b.id === bookId ? { ...b, vote_count: newVoteCount } : b
      )
    );
  }, []);

  const transferBooksToNextMonth = useCallback(
    async (currentMonth: Date) => {
      // Seçili aydaki kitapları bul
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const booksInMonth = books.filter((book) => {
        const bookDate = new Date(book.created_at);
        return (
          bookDate.getFullYear() === year && bookDate.getMonth() === month
        );
      });

      if (booksInMonth.length === 0) {
        throw new Error('Bu ayda aktarılacak kitap yok');
      }

      // Sonraki ayı hesapla
      const nextMonth = new Date(year, month + 1, 1);

      // Her kitabın tarihini güncelle
      const bookIds = booksInMonth.map((b) => b.id);
      await moveBooksToDate(bookIds, nextMonth.toISOString());

      // Local state'i güncelle
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          bookIds.includes(b.id)
            ? { ...b, created_at: nextMonth.toISOString() }
            : b
        )
      );

      return booksInMonth.length;
    },
    [books]
  );

  return {
    books,
    loading,
    fetchBooks,
    deleteBook,
    deleteAllBooks,
    updateVoteCount,
    transferBooksToNextMonth,
  };
}

