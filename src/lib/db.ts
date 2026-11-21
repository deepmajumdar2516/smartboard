import Dexie, { Table } from 'dexie';
import { Notebook, Page, Folder, PdfDocumentRecord } from '../types';

export interface AppSetting {
  key: string;
  value: string;
}

export class SmartNoteDatabase extends Dexie {
  notebooks!: Table<Notebook, string>;
  pages!: Table<Page, string>;
  folders!: Table<Folder, string>;
  pdfDocuments!: Table<PdfDocumentRecord, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('SmartNoteDB');

    this.version(1).stores({
      notebooks: 'id, title, isFavorite, folderId, updatedAt, createdAt, isPdfDocument',
      pages: 'id, notebookId, pageNumber, updatedAt',
      folders: 'id, name, createdAt',
      pdfDocuments: 'id, notebookId, fileName, createdAt',
      settings: 'key',
    });
  }
}

export const db = new SmartNoteDatabase();

// Seed default folders & introductory notebook if empty
export async function seedInitialDataIfNeeded(): Promise<void> {
  const notebookCount = await db.notebooks.count();
  if (notebookCount > 0) return;

  const now = new Date().toISOString();

  // Create default folders
  const defaultFolders: Folder[] = [
    { id: 'folder-math', name: 'Mathematics', color: '#4F46E5', createdAt: now },
    { id: 'folder-physics', name: 'Physics & Chemistry', color: '#06B6D4', createdAt: now },
    { id: 'folder-cs', name: 'Computer Science', color: '#10B981', createdAt: now },
  ];

  await db.folders.bulkAdd(defaultFolders);

  // Create a beautiful starter notebook
  const welcomeNotebookId = 'notebook-welcome';
  const welcomeNotebook: Notebook = {
    id: welcomeNotebookId,
    title: '🎓 Welcome to SmartNote Guide',
    description: 'Learn how to write, draw, solve equations, manage A4 pages, and export PDFs.',
    coverColor: '#4F46E5',
    isFavorite: true,
    folderId: 'folder-cs',
    isPdfDocument: false,
    orientation: 'portrait',
    defaultTemplate: 'ruled',
    pageCount: 3,
    createdAt: now,
    updatedAt: now,
  };

  await db.notebooks.add(welcomeNotebook);

  // Pre-generate starter pages with initial drawings/notes
  const page1: Page = {
    id: 'page-welcome-1',
    notebookId: welcomeNotebookId,
    pageNumber: 1,
    pageWidth: 794,
    pageHeight: 1123,
    orientation: 'portrait',
    backgroundType: 'ruled',
    backgroundColor: '#FFFFFF',
    createdAt: now,
    updatedAt: now,
    canvasData: JSON.stringify({
      version: '5.3.0',
      objects: [
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 100,
          width: 580,
          height: 50,
          fill: '#4F46E5',
          text: 'SmartNote — Digital Notebook & Whiteboard',
          fontSize: 26,
          fontWeight: 'bold',
          fontFamily: 'Inter',
        },
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 170,
          width: 560,
          height: 120,
          fill: '#334155',
          text: '✨ Features Overview:\n• Realistic A4 Paper Workspace (Portrait & Landscape)\n• Smooth pressure-sensitive handwriting with Pen, Pencil & Highlighter\n• High-fidelity vector shapes, arrows, lines, and text\n• Open, annotate, and add new pages to any PDF\n• 1-Click Multi-Page PDF Export with crisp A4 vector fidelity\n• Offline-first with auto-save & Supabase Cloud Sync',
          fontSize: 16,
          lineHeight: 1.5,
          fontFamily: 'Inter',
        },
        {
          type: 'rect',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 360,
          width: 590,
          height: 180,
          fill: '#EEF2FF',
          stroke: '#6366F1',
          strokeWidth: 2,
          rx: 12,
          ry: 12,
        },
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 120,
          top: 380,
          width: 550,
          height: 40,
          fill: '#312E81',
          text: '📐 Mathematical Formulas & Derivations',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'Inter',
        },
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 120,
          top: 430,
          width: 540,
          height: 80,
          fill: '#1E1B4B',
          text: 'Euler\'s Identity:   e^(i·π) + 1 = 0\nQuadratic Formula:   x = (-b ± √(b² - 4ac)) / (2a)\nGaussian Normal Integral:   ∫ e^(-x²) dx = √π',
          fontSize: 16,
          lineHeight: 1.6,
          fontFamily: 'JetBrains Mono',
        },
        {
          type: 'path',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 200,
          top: 600,
          fill: null,
          stroke: '#06B6D4',
          strokeWidth: 4,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          path: [
            ['M', 200, 600],
            ['Q', 250, 560, 320, 610],
            ['T', 450, 620],
            ['T', 550, 580]
          ],
        },
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 670,
          width: 580,
          height: 50,
          fill: '#059669',
          text: '💡 Try drawing directly using the floating toolbar above or with your stylus!',
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Inter',
        }
      ]
    })
  };

  const page2: Page = {
    id: 'page-welcome-2',
    notebookId: welcomeNotebookId,
    pageNumber: 2,
    pageWidth: 794,
    pageHeight: 1123,
    orientation: 'portrait',
    backgroundType: 'grid',
    backgroundColor: '#FFFFFF',
    createdAt: now,
    updatedAt: now,
    canvasData: JSON.stringify({
      version: '5.3.0',
      objects: [
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 80,
          width: 500,
          height: 40,
          fill: '#1E293B',
          text: 'Page 2: Grid Paper & Geometric Diagrams',
          fontSize: 22,
          fontWeight: 'bold',
          fontFamily: 'Inter',
        },
        {
          type: 'circle',
          version: '5.3.0',
          originX: 'center',
          originY: 'center',
          left: 240,
          top: 260,
          radius: 80,
          fill: 'rgba(124, 58, 237, 0.15)',
          stroke: '#7C3AED',
          strokeWidth: 3,
        },
        {
          type: 'triangle',
          version: '5.3.0',
          originX: 'center',
          originY: 'center',
          left: 480,
          top: 260,
          width: 150,
          height: 140,
          fill: 'rgba(6, 182, 212, 0.15)',
          stroke: '#06B6D4',
          strokeWidth: 3,
        },
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 400,
          width: 580,
          height: 100,
          fill: '#475569',
          text: 'Switch paper background templates anytime from the toolbar or page sidebar: Ruled, College Ruled, Grid, Graph Paper, Dotted, Blank, and Custom.',
          fontSize: 16,
          lineHeight: 1.5,
          fontFamily: 'Inter',
        }
      ]
    })
  };

  const page3: Page = {
    id: 'page-welcome-3',
    notebookId: welcomeNotebookId,
    pageNumber: 3,
    pageWidth: 794,
    pageHeight: 1123,
    orientation: 'portrait',
    backgroundType: 'dotted',
    backgroundColor: '#FFFFFF',
    createdAt: now,
    updatedAt: now,
    canvasData: JSON.stringify({
      version: '5.3.0',
      objects: [
        {
          type: 'i-text',
          version: '5.3.0',
          originX: 'left',
          originY: 'top',
          left: 100,
          top: 80,
          width: 500,
          height: 40,
          fill: '#1E293B',
          text: 'Page 3: Dotted Journaling & Study Notes',
          fontSize: 22,
          fontWeight: 'bold',
          fontFamily: 'Inter',
        }
      ]
    })
  };

  await db.pages.bulkAdd([page1, page2, page3]);
}
