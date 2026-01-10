'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type Book } from '@/lib/supabase';

/**
 * Kitapları yükleme ve yönetme hook'u
 */
export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        alert(`Veri yükleme hatası: ${error.message}`);
        throw error;
      }

      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const deleteBook = useCallback(async (id: number) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      setBooks((prevBooks) => prevBooks.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }, []);

  const deleteAllBooks = useCallback(async () => {
    try {
      const { error } = await supabase.from('books').delete().neq('id', 0);
      if (error) throw error;
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
      const { error } = await supabase
        .from('books')
        .update({ created_at: nextMonth.toISOString() })
        .in('id', bookIds);

      if (error) throw error;

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

