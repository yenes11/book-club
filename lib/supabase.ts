import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export type Book = {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  vote_count: number;
  author?: string | null;
  published_year?: number | null;
  cover_image_url?: string | null;
  open_library_id?: string | null;
  page_count?: number | null;
};
