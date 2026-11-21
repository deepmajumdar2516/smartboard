import React, { useState } from 'react';
import {
  FileDown,
  X,
  FileCheck,
  CheckCircle,
  Eye,
  Settings2,
  Sparkles,
  Loader2,
  Download,
} from 'lucide-react';
import { Notebook, Page } from '../../types';
import { generatePdfBlob, downloadNotebookAsPdf, ExportPdfOptions } from '../../lib/pdfExporter';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  pages: Page[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  notebook,
  pages,
}) => {
  const [fileName, setFileName] = useState(
    `${notebook.title.replace(/[/\\?%*:|"<>]/g, '_')}_notes.pdf`
  );
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState(`1-${pages.length}`);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePreview = async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: pages.length });

    try {
      const options: ExportPdfOptions = {
        fileName,
        pageRange: pageRangeMode,
        customRange,
        includeBackgroundTemplate: includeBackground,
        onProgress: (current, total) => setExportProgress({ current, total }),
      };

      const { url } = await generatePdfBlob(notebook, pages, options);
      setPreviewUrl(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleDirectDownload = async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: pages.length });

    try {
      const options: ExportPdfOptions = {
        fileName,
        pageRange: pageRangeMode,
        customRange,
        includeBackgroundTemplate: includeBackground,
        onProgress: (current, total) => setExportProgress({ current, total }),
      };

      await downloadNotebookAsPdf(notebook, pages, options);
      onClose();
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">Export as A4 PDF</h3>
              <p className="text-xs text-slate-500">
                High-fidelity vector & annotation export for {pages.length} pages
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

        {/* Form Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* File Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
              placeholder="Enter exported PDF filename"
            />
          </div>

          {/* Page Range Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Page Range
            </label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                  pageRangeMode === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="pageRange"
                  checked={pageRangeMode === 'all'}
                  onChange={() => setPageRangeMode('all')}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-medium">All Pages ({pages.length})</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                  pageRangeMode === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="pageRange"
                  checked={pageRangeMode === 'custom'}
                  onChange={() => setPageRangeMode('custom')}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-medium">Custom Range</span>
              </label>
            </div>

            {pageRangeMode === 'custom' && (
              <input
                type="text"
                value={customRange}
                onChange={(e) => setCustomRange(e.target.value)}
                placeholder="e.g. 1-3, 5"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600"
              />
            )}
          </div>

          {/* Background template options */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <div className="text-sm font-medium text-slate-800">
                Include Paper Background Template
              </div>
              <div className="text-xs text-slate-500">
                Exports ruled lines, grid, graph, or dotted paper pattern along with handwriting
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeBackground}
              onChange={(e) => setIncludeBackground(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Progress Indicator */}
          {isExporting && exportProgress && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Generating high-resolution vector PDF...
                </span>
                <span>
                  Page {exportProgress.current} of {exportProgress.total}
                </span>
              </div>
              <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{
                    width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* PDF Preview Frame if generated */}
          {previewUrl && (
            <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  PDF Preview Ready
                </span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="w-full h-64 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
          >
            Cancel
          </button>

          {!previewUrl && (
            <button
              onClick={handleGeneratePreview}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium text-sm flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>Preview PDF</span>
            </button>
          )}

          <button
            onClick={handleDirectDownload}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
