// Supabase'deki books tablosunu Neon'a kopyalar.
// Kullanım: node --env-file=.env scripts/migrate-from-supabase.mjs
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, DATABASE_URL } = process.env;
if (!url || !key || !DATABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ve DATABASE_URL gerekli');
}

const res = await fetch(`${url}/rest/v1/books?select=*&order=id`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
const books = await res.json();
console.log(`Supabase'den ${books.length} kitap okundu`);

const sql = neon(DATABASE_URL);
for (const stmt of readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8').split(';')) {
  if (stmt.trim()) await sql.query(stmt);
}

for (const b of books) {
  await sql`
    insert into books (id, created_at, name, description, vote_count, author,
      published_year, cover_image_url, open_library_id, page_count)
    values (${b.id}, ${b.created_at}, ${b.name}, ${b.description}, ${b.vote_count ?? 0},
      ${b.author ?? null}, ${b.published_year ?? null}, ${b.cover_image_url ?? null},
      ${b.open_library_id ?? null}, ${b.page_count ?? null})
    on conflict (id) do nothing`;
}

// Açık id'lerle ekleme yaptığımız için identity sayacını ileri al
await sql`select setval(pg_get_serial_sequence('books', 'id'), coalesce((select max(id) from books), 1))`;

const [{ count }] = await sql`select count(*)::int as count from books`;
console.log(`Neon'da toplam ${count} kitap var`);
