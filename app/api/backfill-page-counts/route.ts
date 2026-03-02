import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getPageCountFromOpenLibrary(openLibraryId: string): Promise<number | null> {
  try {
    // Önce works endpoint'inden deneyelim
    const worksResponse = await fetch(
      `https://openlibrary.org/works/${openLibraryId}.json`
    );

    if (worksResponse.ok) {
      const worksData = await worksResponse.json();
      if (worksData.number_of_pages) {
        return worksData.number_of_pages;
      }
    }

    // Editions endpoint'inden sayfa sayısını almayı dene
    const editionsResponse = await fetch(
      `https://openlibrary.org/works/${openLibraryId}/editions.json?limit=10`
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

    // Search API'den de deneyebiliriz
    return null;
  } catch (error) {
    console.error(`Sayfa sayısı getirme hatası (${openLibraryId}):`, error);
    return null;
  }
}

export async function POST() {
  try {
    // page_count'u olmayan ve open_library_id'si olan kitapları bul
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, name, open_library_id')
      .is('page_count', null)
      .not('open_library_id', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ 
        message: 'Güncellenecek kitap bulunamadı',
        updated: 0 
      });
    }

    const results: { id: number; name: string; pageCount: number | null; success: boolean }[] = [];

    // Her kitap için sayfa sayısını al ve güncelle
    for (const book of books) {
      if (!book.open_library_id) continue;

      const pageCount = await getPageCountFromOpenLibrary(book.open_library_id);
      
      if (pageCount) {
        const { error: updateError } = await supabase
          .from('books')
          .update({ page_count: pageCount })
          .eq('id', book.id);

        results.push({
          id: book.id,
          name: book.name,
          pageCount,
          success: !updateError,
        });
      } else {
        results.push({
          id: book.id,
          name: book.name,
          pageCount: null,
          success: false,
        });
      }

      // Rate limiting için kısa bir bekleme
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const successCount = results.filter((r) => r.success && r.pageCount).length;

    return NextResponse.json({
      message: `${successCount}/${books.length} kitabın sayfa sayısı güncellendi`,
      updated: successCount,
      total: books.length,
      results,
    });
  } catch (error) {
    console.error('Backfill hatası:', error);
    return NextResponse.json(
      { error: 'Sayfa sayıları güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
