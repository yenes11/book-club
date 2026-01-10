'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { VoteBadge } from './vote-badge';
import { BookActions } from './book-actions';
import type { Book } from '@/lib/supabase';

interface UseBooksColumnsParams {
  onVote: (book: Book) => void;
  onDelete: (book: Book) => void;
  votingBookId: number | null;
  animatedBookId: number | null;
}

export function useBooksColumns({
  onVote,
  onDelete,
  votingBookId,
  animatedBookId,
}: UseBooksColumnsParams) {
  return useMemo<ColumnDef<Book>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'İsim',
        cell: ({ row }) => {
          const book = row.original;
          return <div>{book.name || '-'}</div>;
        },
      },
      {
        accessorKey: 'author',
        header: 'Yazar',
        cell: ({ row }) => {
          const book = row.original;
          return <div>{book.author || '-'}</div>;
        },
      },
      {
        accessorKey: 'description',
        header: 'Açıklama',
        cell: ({ row }) => {
          const book = row.original;
          return (
            <div className="max-w-md wrap-break-word whitespace-normal text-sm">
              {book.description || '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'vote_count',
        header: 'Oy Sayısı',
        enableSorting: true,
        cell: ({ row }) => {
          const book = row.original;
          return (
            <VoteBadge
              book={book}
              isVoting={votingBookId === book.id}
              isAnimating={animatedBookId === book.id}
              onVote={onVote}
            />
          );
        },
      },
      {
        id: 'actions',
        size: 120,
        minSize: 120,
        maxSize: 120,
        cell: ({ row }) => {
          const book = row.original;
          return <BookActions book={book} onDelete={onDelete} />;
        },
      },
    ],
    [onVote, onDelete, votingBookId, animatedBookId]
  );
}
