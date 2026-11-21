import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';
import { Notebook, Page } from '../types';
import { drawPaperTemplate, getPageDimensions } from './paperTemplates';

export interface ExportPdfOptions {
  fileName?: string;
  pageRange?: 'all' | 'custom';
  customRange?: string; // e.g. "1-3, 5"
  includeBackgroundTemplate?: boolean;
  quality?: number; // 0.8 - 1.0
  onProgress?: (current: number, total: number) => void;
}

/**
 * Parses user range string like "1-3, 5, 8" into array of 1-based page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Renders a single Page to an image DataURL using canvas + fabric.StaticCanvas
 */
export async function renderPageToImage(
  page: Page,
  includeBackgroundTemplate: boolean = true,
  scale: number = 2.0
): Promise<string> {
  const { width, height } = getPageDimensions(page.orientation);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = targetWidth;
  offscreenCanvas.height = targetHeight;
  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Scale context
  ctx.scale(scale, scale);

  // 1. Draw Paper background template if requested
  if (includeBackgroundTemplate) {
    drawPaperTemplate(ctx, width, height, page.backgroundType, page.backgroundColor);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw imported PDF background image if present
  if (page.backgroundImage) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = page.backgroundImage!;
    });
  }

  // 3. Render Fabric vector objects (handwriting, shapes, text, etc.)
  if (page.canvasData) {
    await new Promise<void>((resolve) => {
      try {
        const fabricCanvasElement = document.createElement('canvas');
        fabricCanvasElement.width = width;
        fabricCanvasElement.height = height;

        const staticCanvas = new fabric.StaticCanvas(fabricCanvasElement, {
          width: width,
          height: height,
          enableRetinaScaling: false,
        });

        const parsedData = typeof page.canvasData === 'string'
          ? JSON.parse(page.canvasData)
          : page.canvasData;

        staticCanvas.loadFromJSON(parsedData, () => {
          staticCanvas.renderAll();
          // Draw rendered fabric canvas on top of our background
          ctx.drawImage(fabricCanvasElement, 0, 0, width, height);
          staticCanvas.dispose();
          resolve();
        });
      } catch (err) {
        console.warn('Error rendering fabric canvas data for PDF page:', err);
        resolve();
      }
    });
  }

  return offscreenCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Generates a multi-page A4 PDF using jsPDF
 */
export async function generatePdfBlob(
  notebook: Notebook,
  pages: Page[],
  options: ExportPdfOptions = {}
): Promise<{ blob: Blob; url: string }> {
  const {
    pageRange = 'all',
    customRange = '',
    includeBackgroundTemplate = true,
    onProgress,
  } = options;

  // Determine pages to include
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const targetPageNumbers =
    pageRange === 'custom'
      ? parsePageRange(customRange, sortedPages.length)
      : sortedPages.map((_, i) => i + 1);

  const selectedPages = sortedPages.filter((p) => targetPageNumbers.includes(p.pageNumber));
  if (selectedPages.length === 0) {
    throw new Error('No pages selected for PDF export');
  }

  // Initialize jsPDF with first page dimensions
  const firstPage = selectedPages[0];
  const firstOrientation = firstPage.orientation === 'landscape' ? 'l' : 'p';

  // Standard A4 in mm: 210 x 297 mm
  const doc = new jsPDF({
    orientation: firstOrientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = selectedPages.length;

  for (let i = 0; i < selectedPages.length; i++) {
    const page = selectedPages[i];
    onProgress?.(i + 1, total);

    const isLandscape = page.orientation === 'landscape';
    const orientationChar = isLandscape ? 'l' : 'p';
    const widthMm = isLandscape ? 297 : 210;
    const heightMm = isLandscape ? 210 : 297;

    // Add page if not the first
    if (i > 0) {
      doc.addPage('a4', orientationChar);
    }

    // Render page to image at high resolution (crisp 300/150 DPI vector rendering)
    const pageDataUrl = await renderPageToImage(page, includeBackgroundTemplate, 2.0);

    // Add image onto jsPDF page with exact mm dimensions
    doc.addImage(pageDataUrl, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return { blob, url };
}

/**
 * Exports and triggers instant download of the PDF file
 */
export async function downloadNotebookAsPdf(
  notebook: Notebook,
  pages: Page[],
  options: ExportPdfOptions = {}
): Promise<void> {
  const { blob, url } = await generatePdfBlob(notebook, pages, options);

  const fileName = options.fileName?.trim()
    ? (options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`)
    : `${notebook.title.replace(/[/\\?%*:|"<>]/g, '_')}_notes.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
