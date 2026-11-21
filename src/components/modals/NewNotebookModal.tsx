import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Palette,
  FileSpreadsheet,
  FolderPlus,
  Plus,
  Sparkles,
} from 'lucide-react';
import { BackgroundTemplateType, Folder, PageOrientation } from '../../types';
import { TEMPLATE_OPTIONS } from '../../lib/paperTemplates';

interface NewNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  onCreate: (notebookData: {
    title: string;
    description: string;
    coverColor: string;
    folderId?: string;
    orientation: PageOrientation;
    defaultTemplate: BackgroundTemplateType;
  }) => void;
  onCreateFolder: (name: string, color: string) => Promise<string>;
}

const COVER_COLORS = [
  '#4F46E5', // Indigo
  '#7C3AED', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#334155', // Slate
];

export const NewNotebookModal: React.FC<NewNotebookModalProps> = ({
  isOpen,
  onClose,
  folders,
  onCreate,
  onCreateFolder,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState('#4F46E5');
  const [folderId, setFolderId] = useState<string>('');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [template, setTemplate] = useState<BackgroundTemplateType>('ruled');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      coverColor,
      folderId: folderId || undefined,
      orientation,
      defaultTemplate: template,
    });

    onClose();
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;
    const createdId = await onCreateFolder(newFolderName.trim(), '#4F46E5');
    setFolderId(createdId);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">Create New Notebook</h3>
              <p className="text-xs text-slate-500">
                Setup your study notebook with realistic A4 paper
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notebook Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Physics Quantum Mechanics, Organic Chemistry..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Subject Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or topic"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm"
            />
          </div>

          {/* Cover Color & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Cover Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCoverColor(color)}
                    className={`w-7 h-7 rounded-full transition transform hover:scale-110 ${
                      coverColor === color
                        ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Folder / Subject
              </label>
              {!isCreatingFolder ? (
                <div className="flex gap-1.5">
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="">No Folder (General)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(true)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Add New Folder"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New Folder Name"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewFolder}
                    className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-2 py-1 text-xs border rounded-lg text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Paper Orientation & Initial Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-3 rounded-xl border text-center text-xs font-medium transition ${
                    orientation === 'portrait'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  📄 Portrait (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-3 rounded-xl border text-center text-xs font-medium transition ${
                    orientation === 'landscape'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  📜 Landscape
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Starting Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as BackgroundTemplateType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 bg-white"
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Notebook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
