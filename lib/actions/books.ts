'use server';

import { sql } from '@/lib/db';
import type { Book } from '@/lib/types';

// bigint id ve timestamptz alanlarını client'ın beklediği tiplere çevir
function toBook(row: Record<string, unknown>): Book {
  return {
    ...(row as Book),
    id: Number(row.id),
    created_at: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function getBooks(): Promise<Book[]> {
  const rows = await sql`select * from books order by created_at desc`;
  return rows.map(toBook);
}

export async function addBook(
  book: Omit<Book, 'id' | 'vote_count'>,
): Promise<Book> {
  const rows = await sql`
    insert into books (name, description, vote_count, author, published_year,
      cover_image_url, open_library_id, page_count, created_at)
    values (${book.name}, ${book.description}, 0, ${book.author ?? null},
      ${book.published_year ?? null}, ${book.cover_image_url ?? null},
      ${book.open_library_id ?? null}, ${book.page_count ?? null}, ${book.created_at})
    returning *`;
  return toBook(rows[0]);
}

export async function deleteBook(id: number): Promise<void> {
  await sql`delete from books where id = ${id}`;
}

export async function deleteAllBooks(): Promise<void> {
  await sql`delete from books`;
}

/** Oy sayısını atomik olarak artırır/azaltır ve yeni değeri döner */
export async function changeVote(id: number, delta: 1 | -1): Promise<number> {
  const rows = await sql`
    update books set vote_count = vote_count + ${delta}
    where id = ${id}
    returning vote_count`;
  if (!rows[0]) throw new Error('Kitap bulunamadı');
  return Number(rows[0].vote_count);
}

export async function moveBooksToDate(
  ids: number[],
  createdAt: string,
): Promise<void> {
  await sql`update books set created_at = ${createdAt} where id = any(${ids})`;
}
