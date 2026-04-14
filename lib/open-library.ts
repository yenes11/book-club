export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  number_of_pages_median?: number;
}

export interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[];
  numFound: number;
  start: number;
}

export interface BookSearchResult {
  title: string;
  author?: string;
  publishedYear?: number;
  coverImageUrl?: string;
  openLibraryId: string;
  isbn?: string;
  description?: string;
  pageCount?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Open Library API'den kitap arama
 */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(
        query
      )}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,isbn,number_of_pages_median`
    );

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    return data.docs.map((book) => ({
      title: book.title,
      author: book.author_name?.[0] || undefined,
      publishedYear: book.first_publish_year || undefined,
      coverImageUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : undefined,
      openLibraryId: book.key.replace('/works/', ''),
      isbn: book.isbn?.[0] || undefined,
      pageCount: book.number_of_pages_median || undefined,
    }));
  } catch (error) {
    console.error('Kitap arama hatası:', error);
    throw new Error('Kitap arama sırasında bir hata oluştu');
  }
}

/**
 * Open Library ID ile kitabın sayfa sayısını getir
 */
export async function getBookPageCount(
  openLibraryId: string
): Promise<number | null> {
  try {
    // Önce works endpoint'inden deneyelim
    const worksResponse = await fetch(
      `https://openlibrary.org/works/${openLibraryId}.json`
    );

    if (worksResponse.ok) {
      const worksData = await worksResponse.json();
      // Works'de editions varsa, ilk edition'ın sayfa sayısını al
      if (worksData.number_of_pages) {
        return worksData.number_of_pages;
      }
    }

    // Editions endpoint'inden sayfa sayısını almayı dene
    const editionsResponse = await fetch(
      `https://openlibrary.org/works/${openLibraryId}/editions.json?limit=5`
    );

    if (editionsResponse.ok) {
      const editionsData = await editionsResponse.json();
      // İlk sayfa sayısı bulunan edition'ı al
      for (const edition of editionsData.entries || []) {
        if (edition.number_of_pages) {
          return edition.number_of_pages;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Sayfa sayısı getirme hatası:', error);
    return null;
  }
}

/**
 * Gemini AI ile kitap açıklaması oluştur
 */
export async function generateBookDescriptionWithAI(
  title: string,
  author?: string,
  publishedYear?: number
): Promise<string | null> {
  const maxAttempts = 3;
  const baseDelayMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          author,
          publishedYear,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        const message =
          (error && typeof error === 'object' && 'error' in error
            ? (error as { error?: string }).error
            : undefined) || `Açıklama oluşturulamadı (HTTP ${response.status})`;
        throw new Error(message);
      }

      const data = await response.json().catch(() => null);
      const description =
        data && typeof data === 'object' && 'description' in data
          ? String((data as { description?: unknown }).description || '').trim()
          : '';

      if (description) return description;
      throw new Error('Boş açıklama döndü');
    } catch (error) {
      console.error(
        `AI açıklama oluşturma hatası (deneme ${attempt}/${maxAttempts}):`,
        error
      );
      if (attempt < maxAttempts) {
        // Exponential backoff + küçük jitter
        const jitter = Math.floor(Math.random() * 200);
        await sleep(baseDelayMs * 2 ** (attempt - 1) + jitter);
        continue;
      }
      return null;
    }
  }

  return null;
}
