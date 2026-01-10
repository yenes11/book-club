export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
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
      )}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,isbn`
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
    }));
  } catch (error) {
    console.error('Kitap arama hatası:', error);
    throw new Error('Kitap arama sırasında bir hata oluştu');
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
      const error = await response.json();
      throw new Error(error.error || 'Açıklama oluşturulamadı');
    }

    const data = await response.json();
    return data.description || null;
  } catch (error) {
    console.error('AI açıklama oluşturma hatası:', error);
    return null;
  }
}
