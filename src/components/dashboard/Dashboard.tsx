import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  FileUp,
  Search,
  LayoutGrid,
  List,
  Star,
  Folder,
  FolderPlus,
  Clock,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  FileDown,
  Cloud,
  CheckCircle,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Calendar,
} from 'lucide-react';
import { Notebook, Folder as FolderType, Page } from '../../types';
import { db } from '../../lib/db';
import { NewNotebookModal } from '../modals/NewNotebookModal';
import { OpenPdfModal } from '../modals/OpenPdfModal';
import { SupabaseConfigModal } from '../modals/SupabaseConfigModal';
import { ExportPdfModal } from '../modals/ExportPdfModal';
import { getStoredSupabaseConfig } from '../../lib/supabase';

interface DashboardProps {
  onOpenNotebook: (notebookId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenNotebook }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuNotebookId, setActiveMenuNotebookId] = useState<string | null>(null);

  // Modals
  const [isNewNotebookModalOpen, setIsNewNotebookModalOpen] = useState(false);
  const [isOpenPdfModalOpen, setIsOpenPdfModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [exportModalData, setExportModalData] = useState<{
    notebook: Notebook;
    pages: Page[];
  } | null>(null);

  // Renaming state
  const [renamingNotebookId, setRenamingNotebookId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New folder prompt
  const [isCreatingFolderInline, setIsCreatingFolderInline] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');

  // Cloud status
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);

  // Load notebooks and folders from IndexedDB
  const loadWorkspaceData = async () => {
    const allNotebooks = await db.notebooks.orderBy('updatedAt').reverse().toArray();
    const allFolders = await db.folders.orderBy('name').toArray();

    setNotebooks(allNotebooks);
    setFolders(allFolders);
    setIsCloudConfigured(!!getStoredSupabaseConfig());
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Filter notebooks
  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      const matchesSearch =
        nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFolderId === 'all') return true;
      if (selectedFolderId === 'favorites') return nb.isFavorite;
      if (selectedFolderId === 'pdfs') return nb.isPdfDocument;
      return nb.folderId === selectedFolderId;
    });
  }, [notebooks, searchQuery, selectedFolderId]);

  // Recent Notebooks & Recent PDFs
  const recentNotebooks = useMemo(() => {
    return notebooks.filter((nb) => !nb.isPdfDocument).slice(0, 4);
  }, [notebooks]);

  const recentPdfs = useMemo(() => {
    return notebooks.filter((nb) => nb.isPdfDocument).slice(0, 4);
  }, [notebooks]);

  // Actions
  const handleToggleFavorite = async (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation();
    const updated = !nb.isFavorite;
    await db.notebooks.update(nb.id, { isFavorite: updated, updatedAt: new Date().toISOString() });
    setNotebooks((prev) =>
      prev.map((item) => (item.id === nb.id ? { ...item, isFavorite: updated } : item))
    );
  };

  const handleDuplicate = async (nb: Notebook) => {
    setActiveMenuNotebookId(null);
    const now = new Date().toISOString();
    const newNotebookId = `nb-${Date.now()}`;

    // Get original pages
    const originalPages = await db.pages.where('notebookId').equals(nb.id).toArray();

    const newNotebook: Notebook = {
      ...nb,
      id: newNotebookId,
      title: `${nb.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    const newPages: Page[] = originalPages.map((pg, idx) => ({
      ...pg,
      id: `page-${newNotebookId}-${idx + 1}`,
      notebookId: newNotebookId,
      createdAt: now,
      updatedAt: now,
    }));

    await db.notebooks.add(newNotebook);
    await db.pages.bulkAdd(newPages);
    await loadWorkspaceData();
  };

  const handleDelete = async (notebookId: string) => {
    await db.pages.where('notebookId').equals(notebookId).delete();
    await db.notebooks.delete(notebookId);
    setDeleteConfirmId(null);
    setActiveMenuNotebookId(null);
    await loadWorkspaceData();
  };

  const handleStartRename = (nb: Notebook) => {
    setActiveMenuNotebookId(null);
    setRenamingNotebookId(nb.id);
    setRenameValue(nb.title);
  };

  const handleSaveRename = async (notebookId: string) => {
    if (renameValue.trim()) {
      await db.notebooks.update(notebookId, {
        title: renameValue.trim(),
        updatedAt: new Date().toISOString(),
      });
      await loadWorkspaceData();
    }
    setRenamingNotebookId(null);
  };

  const handleOpenExportModal = async (e: React.MouseEvent, nb: Notebook) => {
    e.stopPropagation();
    setActiveMenuNotebookId(null);
    const pages = await db.pages.where('notebookId').equals(nb.id).sortBy('pageNumber');
    setExportModalData({ notebook: nb, pages });
  };

  const handleCreateFolder = async (name: string, color: string): Promise<string> => {
    const id = `folder-${Date.now()}`;
    const newFolder: FolderType = {
      id,
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    await db.folders.add(newFolder);
    await loadWorkspaceData();
    return id;
  };

  const handleCreateInlineFolder = async () => {
    if (!inlineFolderName.trim()) return;
    await handleCreateFolder(inlineFolderName.trim(), '#4F46E5');
    setInlineFolderName('');
    setIsCreatingFolderInline(false);
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col select-none">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl tracking-tight text-slate-900 font-sans">
                  Smart<span className="text-indigo-600">Note</span>
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Digital Whiteboard & Study Notebook
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, textbooks, subjects, or math equations..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-100/80 border border-transparent focus:border-indigo-600 focus:bg-white focus:outline-none text-xs transition"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Cloud Sync Status Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                isCloudConfigured
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              title="Supabase Cloud Synchronization"
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudConfigured ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {isCloudConfigured ? 'Cloud Synced' : 'Cloud Setup'}
              </span>
            </button>

            {/* Open Existing PDF */}
            <button
              onClick={() => setIsOpenPdfModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <FileUp className="w-4 h-4 text-cyan-600" />
              <span>Open PDF</span>
            </button>

            {/* Create New Notebook */}
            <button
              onClick={() => setIsNewNotebookModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Notebook</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar: Folders & Categories */}
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                selectedFolderId === 'all'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>All Notes</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">
                {notebooks.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolderId('favorites')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                selectedFolderId === 'favorites'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Favorites</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">
                {notebooks.filter((n) => n.isFavorite).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedFolderId('pdfs')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                selectedFolderId === 'pdfs'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Imported PDFs</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">
                {notebooks.filter((n) => n.isPdfDocument).length}
              </span>
            </button>
          </div>

          {/* Subjects / Folders List */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-2 pt-1 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Folders</span>
              <button
                onClick={() => setIsCreatingFolderInline(true)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                title="Create Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isCreatingFolderInline && (
              <div className="p-2 border border-indigo-200 bg-indigo-50/50 rounded-xl space-y-1.5">
                <input
                  type="text"
                  autoFocus
                  value={inlineFolderName}
                  onChange={(e) => setInlineFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateInlineFolder();
                    if (e.key === 'Escape') setIsCreatingFolderInline(false);
                  }}
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => setIsCreatingFolderInline(false)}
                    className="px-2 py-0.5 text-[10px] rounded text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInlineFolder}
                    className="px-2 py-0.5 text-[10px] bg-indigo-600 text-white rounded font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              {folders.map((folder) => {
                const count = notebooks.filter((n) => n.folderId === folder.id).length;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      selectedFolderId === folder.id
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Area: Content & Cards */}
        <main className="flex-1 space-y-6">
          {/* Quick Access Carousel / Recent Section */}
          {selectedFolderId === 'all' && searchQuery === '' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Recent Notebooks & Study Guides</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentNotebooks.map((nb) => (
                  <div
                    key={nb.id}
                    onClick={() => onOpenNotebook(nb.id)}
                    className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-4 shadow-2xs hover:shadow-paper transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Notebook Spine & Cover Preview */}
                      <div
                        className="w-full h-28 rounded-xl mb-3 relative overflow-hidden flex flex-col justify-between p-3 transition transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: nb.coverColor || '#4F46E5' }}
                      >
                        <div className="flex items-center justify-between text-white/90">
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                            A4 Paper
                          </span>
                          <button
                            onClick={(e) => handleToggleFavorite(e, nb)}
                            className="p-1 rounded-full hover:bg-white/20 transition"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                nb.isFavorite
                                  ? 'fill-amber-300 text-amber-300'
                                  : 'text-white/80'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="text-white">
                          <h3 className="font-bold text-sm leading-snug line-clamp-2">
                            {nb.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{nb.pageCount || 1} pages</span>
                        <span>{formatRelativeTime(nb.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Notebooks / Filtered View */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  {selectedFolderId === 'all'
                    ? 'All Notebooks'
                    : selectedFolderId === 'favorites'
                    ? 'Favorite Notes'
                    : selectedFolderId === 'pdfs'
                    ? 'Imported PDF Documents'
                    : folders.find((f) => f.id === selectedFolderId)?.name || 'Notebooks'}
                </h2>
                <span className="text-xs text-slate-400">({filteredNotebooks.length})</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-2xs font-medium'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-2xs font-medium'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Empty state */}
            {filteredNotebooks.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">No notes found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No notes matching "${searchQuery}"`
                    : 'Create your first study notebook or open an existing PDF to start writing.'}
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => setIsNewNotebookModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-sm"
                  >
                    Create Notebook
                  </button>
                  <button
                    onClick={() => setIsOpenPdfModalOpen(true)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                  >
                    Open PDF
                  </button>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNotebooks.map((nb) => {
                  const isMenuOpen = activeMenuNotebookId === nb.id;
                  const isRenaming = renamingNotebookId === nb.id;

                  return (
                    <div
                      key={nb.id}
                      onClick={() => !isRenaming && onOpenNotebook(nb.id)}
                      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-4 shadow-2xs hover:shadow-paper transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover Card */}
                        <div
                          className="w-full aspect-[210/140] rounded-xl mb-3 relative overflow-hidden flex flex-col justify-between p-3.5 transition transform group-hover:scale-[1.01]"
                          style={{ backgroundColor: nb.coverColor || '#4F46E5' }}
                        >
                          <div className="flex items-center justify-between text-white/90">
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                              {nb.isPdfDocument ? (
                                <>
                                  <FileText className="w-3 h-3 text-cyan-300" />
                                  <span>PDF Doc</span>
                                </>
                              ) : (
                                <>
                                  <Layers className="w-3 h-3 text-indigo-200" />
                                  <span className="capitalize">{nb.defaultTemplate}</span>
                                </>
                              )}
                            </span>

                            <button
                              onClick={(e) => handleToggleFavorite(e, nb)}
                              className="p-1 rounded-full hover:bg-white/20 transition"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  nb.isFavorite
                                    ? 'fill-amber-300 text-amber-300'
                                    : 'text-white/80'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="text-white">
                            <h3 className="font-bold text-base leading-snug line-clamp-2">
                              {nb.title}
                            </h3>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          {isRenaming ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="w-full text-xs font-semibold px-2 py-1 rounded border border-indigo-400"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(nb.id);
                                  if (e.key === 'Escape') setRenamingNotebookId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveRename(nb.id)}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">
                              {nb.title}
                            </h4>
                          )}

                          {nb.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{nb.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatRelativeTime(nb.updatedAt)}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenExportModal(e, nb)}
                            title="Export PDF"
                            className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>

                          {/* Menu Trigger */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuNotebookId(isMenuOpen ? null : nb.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-paper-lg border border-slate-200/80 p-1 z-30 animate-in fade-in space-y-0.5 text-xs text-slate-700"
                              >
                                <button
                                  onClick={() => handleStartRename(nb)}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={() => handleDuplicate(nb)}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  onClick={(e) => handleOpenExportModal(e, nb)}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Export as PDF</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={() => setDeleteConfirmId(nb.id)}
                                  className="w-full px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete confirmation dialog inside card */}
                      {deleteConfirmId === nb.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center text-center z-40 animate-in fade-in"
                        >
                          <p className="text-xs font-semibold text-rose-600 mb-1">
                            Delete "{nb.title}"?
                          </p>
                          <p className="text-[11px] text-slate-500 mb-3">
                            This will permanently remove all {nb.pageCount || 1} pages.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 text-xs border rounded-lg text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(nb.id)}
                              className="px-3 py-1 text-xs bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {filteredNotebooks.map((nb) => (
                  <div
                    key={nb.id}
                    onClick={() => onOpenNotebook(nb.id)}
                    className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs"
                        style={{ backgroundColor: nb.coverColor || '#4F46E5' }}
                      >
                        {nb.isPdfDocument ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                          <span>{nb.title}</span>
                          {nb.isFavorite && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>{nb.pageCount || 1} pages</span>
                          <span>{formatRelativeTime(nb.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <button
                        onClick={(e) => handleOpenExportModal(e, nb)}
                        className="p-2 rounded-lg hover:bg-slate-100 hover:text-indigo-600"
                        title="Export PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modals */}
      <NewNotebookModal
        isOpen={isNewNotebookModalOpen}
        onClose={() => setIsNewNotebookModalOpen(false)}
        folders={folders}
        onCreate={async (nbData) => {
          const now = new Date().toISOString();
          const newNotebookId = `nb-${Date.now()}`;
          const newNotebook: Notebook = {
            id: newNotebookId,
            title: nbData.title,
            description: nbData.description,
            coverColor: nbData.coverColor,
            isFavorite: false,
            folderId: nbData.folderId,
            isPdfDocument: false,
            orientation: nbData.orientation,
            defaultTemplate: nbData.defaultTemplate,
            pageCount: 1,
            createdAt: now,
            updatedAt: now,
          };

          await db.notebooks.add(newNotebook);
          await loadWorkspaceData();
          onOpenNotebook(newNotebookId);
        }}
        onCreateFolder={handleCreateFolder}
      />

      <OpenPdfModal
        isOpen={isOpenPdfModalOpen}
        onClose={() => setIsOpenPdfModalOpen(false)}
        onPdfImported={(importedNotebook) => {
          loadWorkspaceData();
          onOpenNotebook(importedNotebook.id);
        }}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigChanged={() => setIsCloudConfigured(!!getStoredSupabaseConfig())}
      />

      {exportModalData && (
        <ExportPdfModal
          isOpen={true}
          onClose={() => setExportModalData(null)}
          notebook={exportModalData.notebook}
          pages={exportModalData.pages}
        />
      )}
    </div>
  );
};
