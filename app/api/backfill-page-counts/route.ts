import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
    const books = (await sql`
      select id, name, open_library_id from books
      where page_count is null and open_library_id is not null`) as {
      id: number;
      name: string;
      open_library_id: string;
    }[];

    if (books.length === 0) {
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
        let success = true;
        try {
          await sql`update books set page_count = ${pageCount} where id = ${book.id}`;
        } catch (updateError) {
          console.error(`Güncelleme hatası (${book.id}):`, updateError);
          success = false;
        }

        results.push({
          id: Number(book.id),
          name: book.name,
          pageCount,
          success,
        });
      } else {
        results.push({
          id: Number(book.id),
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
