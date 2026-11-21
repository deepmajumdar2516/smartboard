-- ==========================================
-- SMARTNOTE DATABASE SCHEMA (SUPABASE POSTGRES)
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Notebooks Table
CREATE TABLE IF NOT EXISTS public.notebooks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
    is_pdf_document BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Pages Table (A4 pages with structured canvas JSON annotations)
CREATE TABLE IF NOT EXISTS public.pages (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    page_width INTEGER NOT NULL DEFAULT 794,
    page_height INTEGER NOT NULL DEFAULT 1123,
    orientation TEXT NOT NULL DEFAULT 'portrait',
    background_type TEXT NOT NULL DEFAULT 'ruled',
    background_color TEXT DEFAULT '#FFFFFF',
    canvas_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. PDF Documents Table
CREATE TABLE IF NOT EXISTS public.pdf_documents (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notebook_id TEXT REFERENCES public.notebooks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT,
    total_pages INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

-- Folders RLS
CREATE POLICY "Users can manage their own folders"
ON public.folders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notebooks RLS
CREATE POLICY "Users can manage their own notebooks"
ON public.notebooks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Pages RLS
CREATE POLICY "Users can access pages of their notebooks"
ON public.pages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = pages.notebook_id
        AND notebooks.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = pages.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

-- PDF Documents RLS
CREATE POLICY "Users can manage their PDF documents"
ON public.pdf_documents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
-- Insert a public/authenticated storage bucket for PDF files:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('smartnote_files', 'smartnote_files', true);
