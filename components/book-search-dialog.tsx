'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  searchBooks,
  generateBookDescriptionWithAI,
  type BookSearchResult,
} from '@/lib/open-library';
import { supabase } from '@/lib/supabase';

interface BookSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: () => void;
  selectedMonth?: Date | null;
}

export default function BookSearchDialog({
  open,
  onOpenChange,
  onBookAdded,
  selectedMonth,
}: BookSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingBookId, setAddingBookId] = useState<string | null>(null);

  // Debounce ile arama
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await searchBooks(searchQuery);
        setSearchResults(results);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Arama sırasında bir hata oluştu'
        );
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectBook = useCallback(
    async (book: BookSearchResult) => {
      try {
        setAddingBookId(book.openLibraryId);
        setError(null);

        // Open Library'de açıklama yoksa Gemini AI ile oluştur

        const bookDescription = await generateBookDescriptionWithAI(
          book.title,
          book.author,
          book.publishedYear
        );

        // Hala açıklama yoksa yazar ve yıl bilgisini kullan
        const finalDescription =
          bookDescription?.trim() ||
          (book.author
            ? `${book.author}${book.publishedYear ? ` (${book.publishedYear})` : ''}`
            : 'Bu kitap için kısa bir açıklama şu an oluşturulamadı.');

        // Seçili ayı kullan, yoksa bugünün tarihini kullan
        const dateToUse = selectedMonth || new Date();

        const { data, error: insertError } = await supabase
          .from('books')
          .insert([
            {
              name: book.title,
              description: finalDescription,
              vote_count: 0,
              author: book.author || null,
              published_year: book.publishedYear || null,
              cover_image_url: book.coverImageUrl || null,
              open_library_id: book.openLibraryId || null,
              page_count: book.pageCount || null,
              created_at: dateToUse.toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        // Başarılı ekleme sonrası
        setSearchQuery('');
        setSearchResults([]);
        onOpenChange(false);
        onBookAdded();
      } catch (err) {
        console.error('Kitap ekleme hatası:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Kitap eklenirken bir hata oluştu'
        );
      } finally {
        setAddingBookId(null);
      }
    },
    [onOpenChange, onBookAdded, selectedMonth]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Kitap Ara</DialogTitle>
          <DialogDescription>
            Open Library'den kitap arayın ve seçin
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kitap adı, yazar veya ISBN ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Aranıyor...
              </span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((book) => {
                const isAdding = addingBookId === book.openLibraryId;
                const isDisabled = addingBookId !== null;
                return (
                  <div
                    key={book.openLibraryId}
                    className={cn(
                      'flex items-start gap-4 p-4 border rounded-lg transition-colors',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-accent cursor-pointer'
                    )}
                    onClick={() => !isDisabled && handleSelectBook(book)}
                  >
                    {book.coverImageUrl && (
                      <Image
                        src={book.coverImageUrl}
                        alt={book.title}
                        width={64}
                        height={96}
                        className="object-cover rounded border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {book.author}
                        </p>
                      )}
                      {book.publishedYear && (
                        <p className="text-xs text-muted-foreground">
                          {book.publishedYear}
                        </p>
                      )}
                    </div>
                    {isAdding && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() && !loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Sonuç bulunamadı
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Arama yapmak için yukarıdaki alana kitap adı, yazar veya ISBN
              girin
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
