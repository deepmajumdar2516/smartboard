import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layout,
  Layers,
  FilePlus2,
  RotateCw,
} from 'lucide-react';
import { Page, BackgroundTemplateType, PageOrientation } from '../../types';
import { TEMPLATE_OPTIONS } from '../../lib/paperTemplates';

interface PageThumbnailsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  pages: Page[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onInsertPageBefore: (index: number) => void;
  onInsertPageAfter: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onChangePageTemplate: (index: number, template: BackgroundTemplateType) => void;
  onChangePageOrientation: (index: number, orientation: PageOrientation) => void;
}

export const PageThumbnailsSidebar: React.FC<PageThumbnailsSidebarProps> = ({
  isOpen,
  onToggle,
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onInsertPageBefore,
  onInsertPageAfter,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onChangePageTemplate,
  onChangePageOrientation,
}) => {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  return (
    <>
      {/* Toggle button on side */}
      <button
        onClick={onToggle}
        className={`fixed top-20 z-30 flex items-center justify-center p-2 rounded-r-xl bg-white shadow-paper border border-l-0 border-slate-200 transition-all duration-300 ${
          isOpen ? 'left-64' : 'left-0'
        }`}
        title={isOpen ? 'Collapse Pages Panel' : 'Show Pages Thumbnails'}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        ) : (
          <div className="flex items-center gap-1.5 px-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700">
              {currentPageIndex + 1}/{pages.length}
            </span>
          </div>
        )}
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-30 w-64 bg-slate-50/95 backdrop-blur-md border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-800">Notebook Pages</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
              {pages.length}
            </span>
          </div>

          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Add Page Button */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <button
            onClick={onAddPage}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New A4 Page</span>
          </button>
        </div>

        {/* Thumbnail List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {pages.map((page, index) => {
            const isSelected = index === currentPageIndex;

            return (
              <div
                key={page.id}
                className={`relative group rounded-xl border p-2 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Page Header: Number & Controls */}
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {page.backgroundType}
                    </span>
                  </span>

                  {/* Move Up/Down Controls */}
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => onMovePage(index, index - 1)}
                      disabled={index === 0}
                      title="Move Page Up"
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3 text-slate-600" />
                    </button>
                    <button
                      onClick={() => onMovePage(index, index + 1)}
                      disabled={index === pages.length - 1}
                      title="Move Page Down"
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Page Miniature Thumbnail Canvas / Preview */}
                <div
                  onClick={() => onSelectPage(index)}
                  className={`relative w-full aspect-[210/297] bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer flex items-center justify-center transition ${
                    page.orientation === 'landscape' ? 'aspect-[297/210]' : ''
                  }`}
                >
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : page.backgroundImage ? (
                    <img
                      src={page.backgroundImage}
                      alt={`PDF Page ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono">Page {index + 1}</div>
                  )}

                  {/* Active Indicator Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-indigo-600 rounded-lg pointer-events-none" />
                  )}
                </div>

                {/* Page Quick Operations Bar */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-slate-500">
                  <button
                    onClick={() => onInsertPageAfter(index)}
                    title="Insert Page After"
                    className="p-1 rounded hover:bg-slate-100 hover:text-indigo-600 text-xs flex items-center gap-0.5"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Insert</span>
                  </button>

                  <button
                    onClick={() => onDuplicatePage(index)}
                    title="Duplicate Page"
                    className="p-1 rounded hover:bg-slate-100 hover:text-indigo-600 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      onChangePageOrientation(
                        index,
                        page.orientation === 'portrait' ? 'landscape' : 'portrait'
                      )
                    }
                    title="Rotate / Change Orientation"
                    className="p-1 rounded hover:bg-slate-100 hover:text-indigo-600 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmIndex(index)}
                    disabled={pages.length <= 1}
                    title={pages.length <= 1 ? 'Cannot delete only page' : 'Delete Page'}
                    className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete Confirmation Popup */}
                {deleteConfirmIndex === index && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                    <p className="text-xs font-semibold text-rose-600 mb-2">Delete Page {index + 1}?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmIndex(null)}
                        className="px-2 py-1 text-xs border rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onDeletePage(index);
                          setDeleteConfirmIndex(null);
                        }}
                        className="px-2 py-1 text-xs bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
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

        {/* Footer Page Navigation */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
          <button
            onClick={() => onSelectPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-semibold text-slate-800">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            onClick={() => onSelectPage(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
