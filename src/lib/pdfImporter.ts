import * as pdfjsLib from 'pdfjs-dist';
import { db } from './db';
import { Notebook, Page, PageOrientation } from '../types';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from './paperTemplates';

// Set up pdf.js worker URL
// Use robust Cloudflare / cdnjs worker matching version 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ImportPdfProgress {
  currentPage: number;
  totalPages: number;
  stage: 'reading' | 'rendering' | 'saving' | 'done';
}

/**
 * Imports an uploaded PDF file, extracts each page at high resolution,
 * creates a new Notebook and individual editable Page records.
 */
export async function importPdfDocument(
  file: File,
  onProgress?: (progress: ImportPdfProgress) => void
): Promise<{ notebook: Notebook; pages: Page[] }> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ currentPage: 0, totalPages: 0, stage: 'reading' });

  // Load PDF with PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const notebookId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Detect overall orientation from first page
  const firstPage = await pdfDoc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  const defaultOrientation: PageOrientation =
    firstViewport.width > firstViewport.height ? 'landscape' : 'portrait';

  const notebook: Notebook = {
    id: notebookId,
    title: file.name.replace(/\.[^/.]+$/, ''),
    description: `Imported PDF (${totalPages} page${totalPages > 1 ? 's' : ''})`,
    coverColor: '#06B6D4',
    isFavorite: false,
    isPdfDocument: true,
    originalPdfName: file.name,
    orientation: defaultOrientation,
    defaultTemplate: 'plain',
    pageCount: totalPages,
    createdAt: now,
    updatedAt: now,
  };

  const pages: Page[] = [];

  // Render each page to an image data URL
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({ currentPage: pageNum, totalPages, stage: 'rendering' });

    const pdfPage = await pdfDoc.getPage(pageNum);
    const unscaledViewport = pdfPage.getViewport({ scale: 1.0 });

    const isLandscape = unscaledViewport.width > unscaledViewport.height;
    const pageOrientation: PageOrientation = isLandscape ? 'landscape' : 'portrait';

    const targetWidth = isLandscape ? A4_HEIGHT_PX : A4_WIDTH_PX;
    const targetHeight = isLandscape ? A4_WIDTH_PX : A4_HEIGHT_PX;

    // Calculate scale to fit our A4 dimensions crisply (2x retina multiplier for high quality)
    const scale = Math.min(
      (targetWidth * 1.5) / unscaledViewport.width,
      (targetHeight * 1.5) / unscaledViewport.height
    );

    const viewport = pdfPage.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth * 1.5;
    canvas.height = targetHeight * 1.5;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill clean white backing
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center viewport if aspect ratio slightly differs
      const offsetX = (canvas.width - viewport.width) / 2;
      const offsetY = (canvas.height - viewport.height) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      await pdfPage.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;
      ctx.restore();
    }

    const pageImageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Generate small thumbnail for sidebar
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = Math.round((160 * targetHeight) / targetWidth);
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }
    const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

    const pageRecord: Page = {
      id: `page-${notebookId}-${pageNum}`,
      notebookId: notebookId,
      pageNumber: pageNum,
      pageWidth: targetWidth,
      pageHeight: targetHeight,
      orientation: pageOrientation,
      backgroundType: 'plain',
      backgroundColor: '#FFFFFF',
      backgroundImage: pageImageDataUrl,
      canvasData: JSON.stringify({ version: '5.3.0', objects: [] }),
      thumbnail: thumbnailDataUrl,
      createdAt: now,
      updatedAt: now,
    };

    pages.push(pageRecord);
  }

  onProgress?.({ currentPage: totalPages, totalPages, stage: 'saving' });

  // Save to Dexie IndexedDB
  await db.notebooks.add(notebook);
  await db.pages.bulkAdd(pages);
  await db.pdfDocuments.add({
    id: `doc-${Date.now()}`,
    notebookId: notebook.id,
    fileName: file.name,
    fileSize: file.size,
    totalPages: totalPages,
    createdAt: now,
  });

  onProgress?.({ currentPage: totalPages, totalPages, stage: 'done' });

  return { notebook, pages };
}
