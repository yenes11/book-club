'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasVoted } from '@/lib/book-votes';
import type { Book } from '@/lib/supabase';

interface VoteBadgeProps {
  book: Book;
  isVoting: boolean;
  isAnimating: boolean;
  onVote: (book: Book) => void;
}

export function VoteBadge({
  book,
  isVoting,
  isAnimating,
  onVote,
}: VoteBadgeProps) {
  const voted = hasVoted(book.id);

  return (
    <button
      onClick={() => !isVoting && onVote(book)}
      disabled={isVoting}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
        'text-sm font-medium transition-colors duration-200 border',
        voted
          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
        isVoting ? 'opacity-50 cursor-wait' : 'cursor-pointer'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          voted ? 'fill-rose-500 text-rose-500' : 'text-gray-400',
          isAnimating && 'animate-heart-beat'
        )}
      />
      <span className={cn('tabular-nums', isAnimating && 'animate-count-pop')}>
        {book.vote_count}
      </span>
    </button>
  );
}
