import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Notebook, Page, Folder } from '../types';

let cachedClient: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  const localUrl = localStorage.getItem('smartnote_supabase_url');
  const localKey = localStorage.getItem('smartnote_supabase_key');

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey };
  }

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem('smartnote_supabase_url', url);
  localStorage.setItem('smartnote_supabase_key', anonKey);
  cachedClient = null; // Reset client
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('smartnote_supabase_url');
  localStorage.removeItem('smartnote_supabase_key');
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey);
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, key);
    const { data: { session }, error } = await testClient.auth.getSession();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}

/**
 * Cloud sync helpers: saves or updates notebook and pages in Supabase if configured
 */
export async function syncNotebookToSupabase(notebook: Notebook, pages: Page[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data: { user } } = await client.auth.getUser();
    const userId = user?.id || 'guest_user';

    // Upsert notebook
    const { error: nbError } = await client.from('notebooks').upsert({
      id: notebook.id,
      user_id: userId,
      title: notebook.title,
      description: notebook.description || '',
      cover_image: notebook.coverColor,
      is_favorite: notebook.isFavorite,
      created_at: notebook.createdAt,
      updated_at: new Date().toISOString(),
    });

    if (nbError) {
      console.warn('Supabase notebook upsert warning:', nbError.message);
      return false;
    }

    // Upsert pages
    const pageRecords = pages.map((p) => ({
      id: p.id,
      notebook_id: notebook.id,
      page_number: p.pageNumber,
      page_width: p.pageWidth,
      page_height: p.pageHeight,
      orientation: p.orientation,
      background_type: p.backgroundType,
      background_color: p.backgroundColor,
      canvas_data: p.canvasData || '{}',
      created_at: p.createdAt,
      updated_at: new Date().toISOString(),
    }));

    const { error: pagesError } = await client.from('pages').upsert(pageRecords);
    if (pagesError) {
      console.warn('Supabase pages upsert warning:', pagesError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Sync to Supabase error:', err);
    return false;
  }
}
