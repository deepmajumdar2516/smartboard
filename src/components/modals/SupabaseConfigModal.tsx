import React, { useState, useEffect } from 'react';
import {
  Cloud,
  X,
  CheckCircle,
  AlertCircle,
  Key,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<{ type: 'none' | 'testing' | 'success' | 'error'; message: string }>({
    type: 'none',
    message: '',
  });
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      if (config) {
        setUrl(config.url);
        setAnonKey(config.anonKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatus({ type: 'error', message: 'Please provide both Supabase URL and Anon Key' });
      return;
    }

    setStatus({ type: 'testing', message: 'Testing connection to Supabase...' });
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());

    if (res.success) {
      saveSupabaseConfig(url.trim(), anonKey.trim());
      setStatus({ type: 'success', message: 'Connected successfully to Supabase!' });
      onConfigChanged();
    } else {
      setStatus({ type: 'error', message: `Connection failed: ${res.message}` });
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setStatus({ type: 'none', message: '' });
    onConfigChanged();
  };

  const sqlSchemaText = `-- Quick Setup SQL for Supabase Editor
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    folder_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notebooks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    folder_id TEXT,
    is_pdf_document BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">Supabase Cloud Sync</h3>
              <p className="text-xs text-slate-500">
                Sync notebooks, handwriting, and PDF annotations across devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto text-sm">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Offline-First with Automatic Cloud Synchronization
              </p>
              <p>
                SmartNote works completely offline using IndexedDB. When connected to Supabase,
                your study notes and handwriting are also securely mirrored to your cloud PostgreSQL
                database.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-mono text-xs"
            />
          </div>

          {status.type !== 'none' && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : status.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}
            >
              {status.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {status.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {status.type === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Database Schema Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                Supabase SQL Schema
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-xs transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Run this in your Supabase SQL Editor to initialize the notebooks and pages tables.
            </p>
            <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-800 max-h-36">
              {sqlSchemaText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          {getStoredSupabaseConfig() ? (
            <button
              onClick={handleDisconnect}
              className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              Disconnect Cloud
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
            >
              Close
            </button>
            <button
              onClick={handleTestAndSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition"
            >
              <Cloud className="w-4 h-4" />
              <span>Connect & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
