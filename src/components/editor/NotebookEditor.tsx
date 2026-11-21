import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileDown,
  Cloud,
  CheckCircle2,
  Loader2,
  Layers,
  Sparkles,
  Share2,
  Settings,
  Maximize2,
  FolderIcon,
  WifiOff,
} from 'lucide-react';
import {
  Notebook,
  Page,
  DrawingSettings,
  BackgroundTemplateType,
  PageOrientation,
  SaveStatus,
} from '../../types';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { WritingToolbar } from './WritingToolbar';
import { PageThumbnailsSidebar } from './PageThumbnailsSidebar';
import { ExportPdfModal } from '../modals/ExportPdfModal';
import { db } from '../../lib/db';
import { syncNotebookToSupabase, getStoredSupabaseConfig } from '../../lib/supabase';
import { getPageDimensions } from '../../lib/paperTemplates';

interface NotebookEditorProps {
  notebookId: string;
  onBackToDashboard: () => void;
}

const DEFAULT_SETTINGS: DrawingSettings = {
  tool: 'pen',
  shapeType: 'rectangle',
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 3,
  opacity: 1.0,
  fontSize: 20,
  fontFamily: 'Inter',
  isPressureSensitive: true,
  palmRejection: true,
  inputMode: 'tablet',
  drawMode: 'double', // Default to double (click & drag); switchable to single (move mouse to draw)
};

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  notebookId,
  onBackToDashboard,
}) => {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [settings, setSettings] = useState<DrawingSettings>(DEFAULT_SETTINGS);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [modeToast, setModeToast] = useState<string | null>(null);

  const handleUpdateSettings = (newSettings: Partial<DrawingSettings>) => {
    if (newSettings.drawMode && newSettings.drawMode !== settings.drawMode) {
      if (newSettings.drawMode === 'single') {
        setModeToast('✨ Single Mode: Moving mouse automatically draws! (Click to lift / drop pen)');
      } else {
        setModeToast('🖱️ Double Mode: Click & drag to draw.');
      }
      setTimeout(() => setModeToast(null), 3500);
    } else if (newSettings.inputMode && newSettings.inputMode !== settings.inputMode) {
      if (newSettings.inputMode === 'tablet') {
        setModeToast('📱 Tablet Mode: Direct 1-touch write enabled (no double-click needed on tablet/stylus)!');
      } else {
        setModeToast('🖱️ Mouse Mode: Standard click & drag drawing enabled.');
      }
      setTimeout(() => setModeToast(null), 3500);
    }
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Undo / Redo triggers & status
  const [undoTrigger, setUndoTrigger] = useState<number>(0);
  const [redoTrigger, setRedoTrigger] = useState<number>(0);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const autoSaveTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Notebook and Pages from Dexie IndexedDB
  const loadData = useCallback(async () => {
    const nb = await db.notebooks.get(notebookId);
    if (!nb) {
      onBackToDashboard();
      return;
    }

    const pgList = await db.pages.where('notebookId').equals(notebookId).sortBy('pageNumber');

    if (pgList.length === 0) {
      // Create at least 1 page if none exists
      const { width, height } = getPageDimensions(nb.orientation);
      const newPage: Page = {
        id: `page-${nb.id}-1`,
        notebookId: nb.id,
        pageNumber: 1,
        pageWidth: width,
        pageHeight: height,
        orientation: nb.orientation,
        backgroundType: nb.defaultTemplate,
        backgroundColor: '#FFFFFF',
        canvasData: JSON.stringify({ version: '5.3.0', objects: [] }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.pages.add(newPage);
      setPages([newPage]);
    } else {
      setPages(pgList);
    }

    setNotebook(nb);
    setCurrentPageIndex(0);
  }, [notebookId, onBackToDashboard]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Adjust zoom to fit screen nicely on initial mount
  useEffect(() => {
    const handleResize = () => {
      if (!notebook) return;
      const { width } = getPageDimensions(pages[currentPageIndex]?.orientation || notebook.orientation);
      const availableWidth = window.innerWidth - (isSidebarOpen ? 280 : 40);
      const targetZoom = Math.min(1.0, Math.max(0.4, (availableWidth * 0.85) / width));
      setZoom(targetZoom);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [notebook, isSidebarOpen, currentPageIndex, pages]);

  // Auto-save logic
  const handleCanvasChange = useCallback(
    (canvasJson: string, thumbnail: string) => {
      setSaveStatus('saving');

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        const currentPage = pages[currentPageIndex];
        if (!currentPage || !notebook) return;

        const updatedPage: Page = {
          ...currentPage,
          canvasData: canvasJson,
          thumbnail: thumbnail || currentPage.thumbnail,
          updatedAt: new Date().toISOString(),
        };

        // Update IndexedDB
        await db.pages.put(updatedPage);

        // Update local state
        setPages((prev) => {
          const updated = [...prev];
          updated[currentPageIndex] = updatedPage;
          return updated;
        });

        // Update Notebook last modified
        const updatedNotebook: Notebook = {
          ...notebook,
          updatedAt: new Date().toISOString(),
        };
        await db.notebooks.put(updatedNotebook);
        setNotebook(updatedNotebook);

        // Sync to Supabase in background if configured
        if (getStoredSupabaseConfig()) {
          syncNotebookToSupabase(updatedNotebook, pages);
        }

        setSaveStatus('saved');
      }, 700); // 700ms debounce
    },
    [pages, currentPageIndex, notebook]
  );

  // Keyboard Shortcuts: Undo (Ctrl+Z), Redo (Ctrl+Y), Fullscreen (F11), Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          setRedoTrigger((prev) => prev + 1);
        } else {
          setUndoTrigger((prev) => prev + 1);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        setRedoTrigger((prev) => prev + 1);
      } else if (e.key === 'p' && !e.ctrlKey) {
        setSettings((prev) => ({ ...prev, tool: 'pen' }));
      } else if (e.key === 'h' && !e.ctrlKey) {
        setSettings((prev) => ({ ...prev, tool: 'highlighter' }));
      } else if (e.key === 'e' && !e.ctrlKey) {
        setSettings((prev) => ({ ...prev, tool: 'eraser' }));
      } else if (e.key === 'v' && !e.ctrlKey) {
        setSettings((prev) => ({ ...prev, tool: 'select' }));
      } else if (e.key === 't' && !e.ctrlKey) {
        setSettings((prev) => ({ ...prev, tool: 'text' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Page Operations
  const handleAddPage = async () => {
    if (!notebook) return;
    const { width, height } = getPageDimensions(notebook.orientation);
    const newPageNumber = pages.length + 1;

    const newPage: Page = {
      id: `page-${notebook.id}-${Date.now()}`,
      notebookId: notebook.id,
      pageNumber: newPageNumber,
      pageWidth: width,
      pageHeight: height,
      orientation: notebook.orientation,
      backgroundType: notebook.defaultTemplate,
      backgroundColor: '#FFFFFF',
      canvasData: JSON.stringify({ version: '5.3.0', objects: [] }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.pages.add(newPage);
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);

    await db.notebooks.update(notebook.id, {
      pageCount: updatedPages.length,
      updatedAt: new Date().toISOString(),
    });

    setCurrentPageIndex(updatedPages.length - 1);
  };

  const handleInsertPageAfter = async (index: number) => {
    if (!notebook) return;
    const { width, height } = getPageDimensions(notebook.orientation);

    const newPage: Page = {
      id: `page-${notebook.id}-${Date.now()}`,
      notebookId: notebook.id,
      pageNumber: index + 2,
      pageWidth: width,
      pageHeight: height,
      orientation: notebook.orientation,
      backgroundType: notebook.defaultTemplate,
      backgroundColor: '#FFFFFF',
      canvasData: JSON.stringify({ version: '5.3.0', objects: [] }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);

    // Re-index all pages
    for (let i = 0; i < updated.length; i++) {
      updated[i].pageNumber = i + 1;
      await db.pages.put(updated[i]);
    }

    setPages(updated);
    await db.notebooks.update(notebook.id, { pageCount: updated.length });
    setCurrentPageIndex(index + 1);
  };

  const handleInsertPageBefore = async (index: number) => {
    if (!notebook) return;
    const { width, height } = getPageDimensions(notebook.orientation);

    const newPage: Page = {
      id: `page-${notebook.id}-${Date.now()}`,
      notebookId: notebook.id,
      pageNumber: index + 1,
      pageWidth: width,
      pageHeight: height,
      orientation: notebook.orientation,
      backgroundType: notebook.defaultTemplate,
      backgroundColor: '#FFFFFF',
      canvasData: JSON.stringify({ version: '5.3.0', objects: [] }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...pages];
    updated.splice(index, 0, newPage);

    for (let i = 0; i < updated.length; i++) {
      updated[i].pageNumber = i + 1;
      await db.pages.put(updated[i]);
    }

    setPages(updated);
    await db.notebooks.update(notebook.id, { pageCount: updated.length });
    setCurrentPageIndex(index);
  };

  const handleDuplicatePage = async (index: number) => {
    if (!notebook) return;
    const sourcePage = pages[index];

    const newPage: Page = {
      ...sourcePage,
      id: `page-${notebook.id}-${Date.now()}`,
      pageNumber: index + 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);

    for (let i = 0; i < updated.length; i++) {
      updated[i].pageNumber = i + 1;
      await db.pages.put(updated[i]);
    }

    setPages(updated);
    await db.notebooks.update(notebook.id, { pageCount: updated.length });
    setCurrentPageIndex(index + 1);
  };

  const handleDeletePage = async (index: number) => {
    if (!notebook || pages.length <= 1) return;

    const pageToDelete = pages[index];
    await db.pages.delete(pageToDelete.id);

    const updated = pages.filter((_, i) => i !== index);
    for (let i = 0; i < updated.length; i++) {
      updated[i].pageNumber = i + 1;
      await db.pages.put(updated[i]);
    }

    setPages(updated);
    await db.notebooks.update(notebook.id, { pageCount: updated.length });
    setCurrentPageIndex(Math.min(currentPageIndex, updated.length - 1));
  };

  const handleMovePage = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length || !notebook) return;

    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    for (let i = 0; i < updated.length; i++) {
      updated[i].pageNumber = i + 1;
      await db.pages.put(updated[i]);
    }

    setPages(updated);
    setCurrentPageIndex(toIndex);
  };

  const handleChangePageTemplate = async (template: BackgroundTemplateType) => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return;

    const updatedPage: Page = {
      ...currentPage,
      backgroundType: template,
      updatedAt: new Date().toISOString(),
    };

    await db.pages.put(updatedPage);
    setPages((prev) => {
      const copy = [...prev];
      copy[currentPageIndex] = updatedPage;
      return copy;
    });
  };

  const handleChangePageOrientation = async (index: number, orientation: PageOrientation) => {
    const targetPage = pages[index];
    if (!targetPage) return;

    const { width, height } = getPageDimensions(orientation);
    const updatedPage: Page = {
      ...targetPage,
      orientation,
      pageWidth: width,
      pageHeight: height,
      updatedAt: new Date().toISOString(),
    };

    await db.pages.put(updatedPage);
    setPages((prev) => {
      const copy = [...prev];
      copy[index] = updatedPage;
      return copy;
    });
  };

  const handleFitPage = () => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return;
    const availableHeight = window.innerHeight - 120;
    const fitZoom = Math.min(1.2, Math.max(0.3, availableHeight / currentPage.pageHeight));
    setZoom(fitZoom);
  };

  const handleFitWidth = () => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return;
    const availableWidth = window.innerWidth - (isSidebarOpen ? 300 : 60);
    const fitZoom = Math.min(1.5, Math.max(0.4, (availableWidth * 0.9) / currentPage.pageWidth));
    setZoom(fitZoom);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentPage = pages[currentPageIndex];

  if (!notebook || !currentPage) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-[#F1F5F9] overflow-hidden select-none"
    >
      {/* Top Application Header */}
      <header className="h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
        {/* Left: Back & Notebook Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 text-sm font-medium transition"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* Editable Notebook Title */}
          <input
            type="text"
            value={notebook.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setNotebook({ ...notebook, title: newTitle });
              db.notebooks.update(notebook.id, { title: newTitle });
            }}
            className="font-semibold text-slate-800 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm max-w-xs md:max-w-md truncate"
          />

          {notebook.isPdfDocument && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-xs font-medium border border-cyan-200 hidden md:inline">
              PDF Mode
            </span>
          )}
        </div>

        {/* Center: Save status & Page Navigation Indicator */}
        <div className="flex items-center gap-3">
          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {saveStatus === 'saving' ? (
              <span className="text-amber-600 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Page Counter & Quick Jump */}
          <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-xl text-xs font-medium text-slate-700">
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 rounded hover:bg-white disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1">
              {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-1 rounded hover:bg-white disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Add Page, Export PDF & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddPage}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition"
            title="Add New A4 Page"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Add Page</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
            title="Export as Multi-Page A4 PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area with Collapsible Sidebar & Floating Island Toolbar */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Page Thumbnails Sidebar */}
        <PageThumbnailsSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          pages={pages}
          currentPageIndex={currentPageIndex}
          onSelectPage={(index) => setCurrentPageIndex(index)}
          onAddPage={handleAddPage}
          onInsertPageBefore={handleInsertPageBefore}
          onInsertPageAfter={handleInsertPageAfter}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onChangePageTemplate={(idx, tmpl) => handleChangePageTemplate(tmpl)}
          onChangePageOrientation={handleChangePageOrientation}
        />

        {/* Floating Writing Toolbar */}
        <WritingToolbar
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => setUndoTrigger((prev) => prev + 1)}
          onRedo={() => setRedoTrigger((prev) => prev + 1)}
          onClearPage={() => setClearTrigger((prev) => prev + 1)}
          zoom={zoom}
          onZoomChange={(newZoom) => setZoom(newZoom)}
          onFitPage={handleFitPage}
          onFitWidth={handleFitWidth}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          currentTemplate={currentPage.backgroundType}
          onChangeTemplate={handleChangePageTemplate}
          onInsertImage={(file) => {
            // Triggers image insertion in WhiteboardCanvas
            const event = new CustomEvent('smartnote:insert-image', { detail: { file } });
            window.dispatchEvent(event);
          }}
        />

        {/* Scrollable / Pannable Workspace */}
        <main
          className={`flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 transition-all duration-300 ${
            isSidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
        >
          <WhiteboardCanvas
            key={currentPage.id}
            page={currentPage}
            settings={settings}
            zoom={zoom}
            onCanvasChange={handleCanvasChange}
            undoTrigger={undoTrigger}
            redoTrigger={redoTrigger}
            clearTrigger={clearTrigger}
            onUndoRedoStatusChange={(undoable, redoable) => {
              setCanUndo(undoable);
              setCanRedo(redoable);
            }}
          />
        </main>
      </div>

      {/* Export as PDF Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        notebook={notebook}
        pages={pages}
      />

      {/* Input Mode Toast Notification */}
      {modeToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{modeToast}</span>
        </div>
      )}
    </div>
  );
};
