/**
 * Oy verme ile ilgili local storage utility fonksiyonları
 * Her kullanıcı her kitaba sadece bir kez oy verebilir, ancak oyunu geri alabilir
 */

const STORAGE_KEY = 'book-club-votes';

/**
 * Kullanıcının bir kitaba daha önce oy verip vermediğini kontrol eder
 */
export function hasVoted(bookId: number): boolean {
  if (typeof window === 'undefined') return false;
  const votedBooks: number[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );
  return votedBooks.includes(bookId);
}

/**
 * Kullanıcının oy verdiğini local storage'a kaydeder
 */
export function markAsVoted(bookId: number): void {
  if (typeof window === 'undefined') return;
  const votedBooks: number[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );
  if (!votedBooks.includes(bookId)) {
    votedBooks.push(bookId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votedBooks));
  }
}

/**
 * Kullanıcının oyunu geri alır
 */
export function removeVote(bookId: number): void {
  if (typeof window === 'undefined') return;
  const votedBooks: number[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );
  const filteredVotes = votedBooks.filter((id) => id !== bookId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredVotes));
}

