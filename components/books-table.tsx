'use client';

import { useState, useCallback } from 'react';
import BookSearchDialog from './book-search-dialog';
import { DeleteBookDialog } from './books/delete-book-dialog';
import { BooksHeader } from './books/books-header';
import { MonthBookTable } from './books/month-book-table';
import { BooksEmptyState } from './books/books-empty-state';
import { useBooks } from '@/hooks/use-books';
import { useVote } from '@/hooks/use-vote';
import { useBooksByMonth } from './books/use-books-by-month';
import { useBooksColumns } from './books/use-books-columns';

export default function BooksTable() {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showNameAndAuthor, setShowNameAndAuthor] = useState(true);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const {
    books,
    loading,
    fetchBooks,
    deleteBook,
    deleteAllBooks,
    updateVoteCount,
    transferBooksToNextMonth,
  } = useBooks();

  const { handleVote, votingBookId, animatedBookId } = useVote(updateVoteCount);

  const booksByMonth = useBooksByMonth(books, selectedMonth);

  const columns = useBooksColumns({
    onVote: handleVote,
    onDelete: (book) => {
      setBookToDelete({ id: book.id, name: book.name });
      setDeleteDialogOpen(true);
    },
    votingBookId,
    animatedBookId,
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!bookToDelete) return;

    try {
      await deleteBook(bookToDelete.id);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    } catch (error) {
      alert('Silme işlemi sırasında bir hata oluştu');
    }
  }, [bookToDelete, deleteBook]);

  const handleDeleteAllConfirm = useCallback(async () => {
    try {
      await deleteAllBooks();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      alert('Tüm kitapları silme işlemi sırasında bir hata oluştu');
    }
  }, [deleteAllBooks]);

  const handleTransferToNextMonth = useCallback(async () => {
    if (!selectedMonth) return;

    try {
      const count = await transferBooksToNextMonth(selectedMonth);
      // Seçili ayı sonraki aya güncelle
      const nextMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      );
      setSelectedMonth(nextMonth);
      alert(`${count} kitap sonraki aya aktarıldı`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Kitapları aktarma sırasında bir hata oluştu'
      );
    }
  }, [selectedMonth, transferBooksToNextMonth]);

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <BookSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onBookAdded={fetchBooks}
        selectedMonth={selectedMonth}
      />

      <DeleteBookDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        bookName={bookToDelete?.name || null}
        onConfirm={handleDeleteConfirm}
      />

      <DeleteBookDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        bookName="TÜM KİTAPLAR"
        onConfirm={handleDeleteAllConfirm}
      />

      <BooksHeader
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onAddClick={() => setSearchDialogOpen(true)}
        showNameAndAuthor={showNameAndAuthor}
        onToggleNameAndAuthor={() => setShowNameAndAuthor(!showNameAndAuthor)}
        onDeleteAllClick={() => setDeleteAllDialogOpen(true)}
        onTransferToNextMonth={handleTransferToNextMonth}
        hasBooks={books.length > 0}
        hasBooksInSelectedMonth={booksByMonth.length > 0}
      />

      {booksByMonth.length > 0 ? (
        <div className="space-y-8">
          {booksByMonth.map(({ monthKey, monthLabel, books: monthBooks }) => (
            <MonthBookTable
              key={monthKey}
              monthLabel={monthLabel}
              books={monthBooks}
              columns={columns}
              columnVisibility={{
                name: showNameAndAuthor,
                author: showNameAndAuthor,
              }}
            />
          ))}
        </div>
      ) : (
        <BooksEmptyState
          selectedMonth={selectedMonth}
          onAddClick={() => setSearchDialogOpen(true)}
        />
      )}
    </div>
  );
}
