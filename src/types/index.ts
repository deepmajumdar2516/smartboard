export type PageOrientation = 'portrait' | 'landscape';

export type BackgroundTemplateType =
  | 'plain'
  | 'ruled'
  | 'college'
  | 'grid'
  | 'dotted'
  | 'blank'
  | 'graph'
  | 'custom';

export type ToolType =
  | 'select'
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'text'
  | 'shape'
  | 'image'
  | 'pan';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow';

export type InputMode = 'tablet' | 'mouse';
export type DrawMode = 'single' | 'double'; // 'single': move mouse to draw; 'double': click and drag to draw

export interface DrawingSettings {
  tool: ToolType;
  shapeType: ShapeType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  isPressureSensitive: boolean;
  palmRejection: boolean;
  inputMode: InputMode;
  drawMode: DrawMode; // 'single': move mouse/stylus draws automatically; 'double': click and drag to draw
}

export interface Page {
  id: string;
  notebookId: string;
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  orientation: PageOrientation;
  backgroundType: BackgroundTemplateType;
  backgroundColor: string;
  backgroundImage?: string; // Data URL for imported PDF page or custom background
  canvasData?: string; // Fabric JSON representation
  thumbnail?: string; // Low-res preview data URL
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  description?: string;
  coverColor: string;
  isFavorite: boolean;
  folderId?: string;
  isPdfDocument: boolean;
  originalPdfName?: string;
  orientation: PageOrientation;
  defaultTemplate: BackgroundTemplateType;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface PdfDocumentRecord {
  id: string;
  notebookId: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  createdAt: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'error';
