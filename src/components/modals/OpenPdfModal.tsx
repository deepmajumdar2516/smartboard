import React, { useState, useRef } from 'react';
import {
  FileUp,
  X,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { importPdfDocument, ImportPdfProgress } from '../../lib/pdfImporter';
import { Notebook, Page } from '../../types';

interface OpenPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPdfImported: (notebook: Notebook, pages: Page[]) => void;
}

export const OpenPdfModal: React.FC<OpenPdfModalProps> = ({
  isOpen,
  onClose,
  onPdfImported,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ImportPdfProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document (.pdf)');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { notebook, pages } = await importPdfDocument(selectedFile, (p) => {
        setProgress(p);
      });

      onPdfImported(notebook, pages);
      onClose();
    } catch (err: any) {
      console.error('PDF import failed', err);
      setError(`Failed to process PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">Open Existing PDF</h3>
              <p className="text-xs text-slate-500">
                Annotate, draw, solve equations, and add new pages
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
        <div className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Click to browse or drag & drop a PDF
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports lecture slides, homework, textbooks & exam papers
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {!isProcessing && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Progress Bar */}
          {isProcessing && progress && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  {progress.stage === 'reading' && 'Reading PDF file...'}
                  {progress.stage === 'rendering' && 'Rendering high-resolution A4 pages...'}
                  {progress.stage === 'saving' && 'Saving notebook to workspace...'}
                </span>
                {progress.totalPages > 0 && (
                  <span>
                    {progress.currentPage} / {progress.totalPages}
                  </span>
                )}
              </div>
              {progress.totalPages > 0 && (
                <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-200"
                    style={{
                      width: `${Math.round((progress.currentPage / progress.totalPages) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStartImport}
            disabled={!selectedFile || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Open & Start Annotating</span>
          </button>
        </div>
      </div>
    </div>
  );
};
