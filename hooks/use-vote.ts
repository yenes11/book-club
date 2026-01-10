'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { hasVoted, markAsVoted, removeVote } from '@/lib/book-votes';
import type { Book } from '@/lib/supabase';

/**
 * Oy verme işlemlerini yöneten hook
 * Her kullanıcı her kitaba sadece bir kez oy verebilir, ancak oyunu geri alabilir
 */
export function useVote(
  onVoteUpdate: (bookId: number, newVoteCount: number) => void
) {
  const [votingBookId, setVotingBookId] = useState<number | null>(null);
  const [animatedBookId, setAnimatedBookId] = useState<number | null>(null);

  const handleVote = useCallback(
    async (book: Book) => {
      const alreadyVoted = hasVoted(book.id);
      setVotingBookId(book.id);

      try {
        const newVoteCount = alreadyVoted
          ? book.vote_count - 1
          : book.vote_count + 1;

        const { error } = await supabase
          .from('books')
          .update({ vote_count: newVoteCount })
          .eq('id', book.id);

        if (error) throw error;

        if (alreadyVoted) {
          // Oyu geri al
          removeVote(book.id);
        } else {
          // Oy ver
          markAsVoted(book.id);
          // Animasyonu başlat
          setAnimatedBookId(book.id);
          setTimeout(() => setAnimatedBookId(null), 600);
        }

        onVoteUpdate(book.id, newVoteCount);
      } catch (error) {
        console.error('Error voting:', error);
        alert('Oy verme sırasında bir hata oluştu');
      } finally {
        setVotingBookId(null);
      }
    },
    [onVoteUpdate]
  );

  return {
    handleVote,
    votingBookId,
    animatedBookId,
  };
}

