import { BackgroundTemplateType, PageOrientation } from '../types';

// Standard A4 dimensions in pixels at 96 DPI
// Width: 210mm (~794px), Height: 297mm (~1123px)
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export function getPageDimensions(orientation: PageOrientation): { width: number; height: number } {
  if (orientation === 'landscape') {
    return { width: A4_HEIGHT_PX, height: A4_WIDTH_PX };
  }
  return { width: A4_WIDTH_PX, height: A4_HEIGHT_PX };
}

export interface TemplateInfo {
  id: BackgroundTemplateType;
  name: string;
  description: string;
  previewColor: string;
}

export const TEMPLATE_OPTIONS: TemplateInfo[] = [
  { id: 'plain', name: 'Plain White', description: 'Clean white sheet', previewColor: '#FFFFFF' },
  { id: 'ruled', name: 'Ruled Notebook', description: 'Standard notebook lines with margin', previewColor: '#F8FAFC' },
  { id: 'college', name: 'College Ruled', description: 'Narrow line spacing for dense notes', previewColor: '#F8FAFC' },
  { id: 'grid', name: 'Grid Paper', description: 'Subtle square grid for math & diagrams', previewColor: '#F8FAFC' },
  { id: 'graph', name: 'Engineering Graph', description: 'Accented millimeter grid for technical work', previewColor: '#F0FDF4' },
  { id: 'dotted', name: 'Dotted Paper', description: 'Bullet journal style dot grid', previewColor: '#F8FAFC' },
  { id: 'blank', name: 'Warm Cream', description: 'Soft eye-friendly ivory tone', previewColor: '#FAF7EE' },
  { id: 'custom', name: 'Dark Slate', description: 'High contrast dark writing board', previewColor: '#1E293B' },
];

/**
 * Draws the selected paper template background onto a 2D canvas context.
 */
export function drawPaperTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: BackgroundTemplateType,
  backgroundColor: string = '#FFFFFF'
): void {
  // 1. Fill base paper color
  ctx.save();
  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  switch (type) {
    case 'ruled': {
      // Standard ruled: lines every 32px, margin line at 80px
      const lineSpacing = 32;
      const topMargin = 70;
      const marginX = 80;

      // Draw horizontal blue/gray lines
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let y = topMargin; y < height - 20; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw left margin line in soft red
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, 0);
      ctx.lineTo(marginX, height);
      ctx.stroke();
      break;
    }

    case 'college': {
      // College ruled: lines every 24px, margin at 70px
      const lineSpacing = 24;
      const topMargin = 60;
      const marginX = 70;

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let y = topMargin; y < height - 20; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(marginX, 0);
      ctx.lineTo(marginX, height);
      ctx.stroke();
      break;
    }

    case 'grid': {
      // Square grid 24px
      const gridSize = 24;
      ctx.strokeStyle = '#EDF2F7';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }

    case 'graph': {
      // Graph paper: 10px minor grid, 50px major grid
      const minorSize = 10;
      const majorSize = 50;

      // Minor lines
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 0.5;
      for (let x = minorSize; x < width; x += minorSize) {
        if (x % majorSize !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
      for (let y = minorSize; y < height; y += minorSize) {
        if (y % majorSize !== 0) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Major lines
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.2;
      for (let x = majorSize; x < width; x += majorSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = majorSize; y < height; y += majorSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }

    case 'dotted': {
      // Dotted grid: 24px interval
      const dotSpacing = 24;
      ctx.fillStyle = '#94A3B8';
      const radius = 1.2;

      for (let x = dotSpacing; x < width; x += dotSpacing) {
        for (let y = dotSpacing; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'blank':
    case 'custom':
    case 'plain':
    default:
      // Solid background already rendered
      break;
  }

  ctx.restore();
}

/**
 * Generates a data URL for a given template to use as a background image in Fabric or HTML
 */
export function generateTemplateDataUrl(
  type: BackgroundTemplateType,
  orientation: PageOrientation,
  backgroundColor?: string
): string {
  const { width, height } = getPageDimensions(orientation);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  let bg = backgroundColor;
  if (!bg) {
    if (type === 'blank') bg = '#FAF7EE';
    else if (type === 'custom') bg = '#1E293B';
    else bg = '#FFFFFF';
  }

  drawPaperTemplate(ctx, width, height, type, bg);
  return canvas.toDataURL('image/png');
}
