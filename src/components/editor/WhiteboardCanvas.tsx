import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Page, DrawingSettings, ToolType, ShapeType } from '../../types';
import { drawPaperTemplate, getPageDimensions } from '../../lib/paperTemplates';

interface WhiteboardCanvasProps {
  page: Page;
  settings: DrawingSettings;
  zoom: number;
  onCanvasChange: (canvasJson: string, thumbnail: string) => void;
  undoTrigger?: number;
  redoTrigger?: number;
  clearTrigger?: number;
  onUndoRedoStatusChange?: (canUndo: boolean, canRedo: boolean) => void;
  onRequestInsertImage?: (file: File) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  page,
  settings,
  zoom,
  onCanvasChange,
  undoTrigger,
  redoTrigger,
  clearTrigger,
  onUndoRedoStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // History stack for undo/redo
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isPerformingHistoryActionRef = useRef<boolean>(false);
  const isDrawingShapeRef = useRef<boolean>(false);
  const shapeOriginRef = useRef<{ x: number; y: number } | null>(null);
  const activeShapeRef = useRef<fabric.Object | null>(null);

  // Single-mode (move to draw) refs
  const isSinglePenDownRef = useRef<boolean>(true);
  const isSingleDrawingActiveRef = useRef<boolean>(false);
  const singleStrokeTimerRef = useRef<any>(null);

  const { width, height } = getPageDimensions(page.orientation);

  // Helper to record history state
  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current || isPerformingHistoryActionRef.current) return;

    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Truncate future states if we were in the middle of history
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(json);

    // Limit history stack size to 30 states to keep memory fast
    if (newHistory.length > 30) {
      newHistory.shift();
    }

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    onUndoRedoStatusChange?.(historyIndexRef.current > 0, false);

    // Notify parent for auto-save
    try {
      // Generate a fast thumbnail
      const thumbnail = fabricCanvasRef.current.toDataURL({
        format: 'jpeg',
        quality: 0.6,
        multiplier: 0.2,
      });
      onCanvasChange(json, thumbnail);
    } catch (e) {
      onCanvasChange(json, '');
    }
  }, [onCanvasChange, onUndoRedoStatusChange]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (!fabricCanvasRef.current || historyIndexRef.current <= 0) return;

    isPerformingHistoryActionRef.current = true;
    historyIndexRef.current -= 1;
    const previousState = historyRef.current[historyIndexRef.current];

    fabricCanvasRef.current.loadFromJSON(JSON.parse(previousState), () => {
      fabricCanvasRef.current?.renderAll();
      isPerformingHistoryActionRef.current = false;
      onUndoRedoStatusChange?.(
        historyIndexRef.current > 0,
        historyIndexRef.current < historyRef.current.length - 1
      );
      if (fabricCanvasRef.current) {
        const thumbnail = fabricCanvasRef.current.toDataURL({
          format: 'jpeg',
          quality: 0.6,
          multiplier: 0.2,
        });
        onCanvasChange(previousState, thumbnail);
      }
    });
  }, [onCanvasChange, onUndoRedoStatusChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (
      !fabricCanvasRef.current ||
      historyIndexRef.current >= historyRef.current.length - 1
    )
      return;

    isPerformingHistoryActionRef.current = true;
    historyIndexRef.current += 1;
    const nextState = historyRef.current[historyIndexRef.current];

    fabricCanvasRef.current.loadFromJSON(JSON.parse(nextState), () => {
      fabricCanvasRef.current?.renderAll();
      isPerformingHistoryActionRef.current = false;
      onUndoRedoStatusChange?.(
        historyIndexRef.current > 0,
        historyIndexRef.current < historyRef.current.length - 1
      );
      if (fabricCanvasRef.current) {
        const thumbnail = fabricCanvasRef.current.toDataURL({
          format: 'jpeg',
          quality: 0.6,
          multiplier: 0.2,
        });
        onCanvasChange(nextState, thumbnail);
      }
    });
  }, [onCanvasChange, onUndoRedoStatusChange]);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: 'transparent',
      selection: settings.tool === 'select' || settings.tool === 'lasso',
      isDrawingMode: ['pen', 'pencil', 'highlighter'].includes(settings.tool),
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      allowTouchScrolling: false,
    });

    fabricCanvasRef.current = fabricCanvas;

    // Enforce instant 0-latency touch without double-tap delay on tablet
    const upperEl = (fabricCanvas as any).upperCanvasEl as HTMLCanvasElement | undefined;
    let handleNativeTouchStart: ((e: TouchEvent) => void) | null = null;

    if (upperEl) {
      upperEl.style.touchAction = 'none';
      upperEl.style.webkitUserSelect = 'none';
      upperEl.style.userSelect = 'none';

      handleNativeTouchStart = (e: TouchEvent) => {
        if (settings.inputMode === 'tablet' && e.touches.length === 1 && settings.tool !== 'pan') {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      };

      upperEl.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    }

    // Load initial page canvas data if present
    if (page.canvasData) {
      try {
        const parsed = JSON.parse(page.canvasData);
        fabricCanvas.loadFromJSON(parsed, () => {
          fabricCanvas.renderAll();
          const initialJson = JSON.stringify(fabricCanvas.toJSON());
          historyRef.current = [initialJson];
          historyIndexRef.current = 0;
          onUndoRedoStatusChange?.(false, false);
        });
      } catch (e) {
        console.error('Failed to parse page canvasData', e);
        const initialJson = JSON.stringify(fabricCanvas.toJSON());
        historyRef.current = [initialJson];
        historyIndexRef.current = 0;
      }
    } else {
      const initialJson = JSON.stringify(fabricCanvas.toJSON());
      historyRef.current = [initialJson];
      historyIndexRef.current = 0;
    }

    // Attach event listeners for canvas changes
    const onObjectModified = () => saveState();
    const onObjectAdded = (e: any) => {
      if (!isPerformingHistoryActionRef.current && !isDrawingShapeRef.current) {
        saveState();
      }
    };
    const onObjectRemoved = () => {
      if (!isPerformingHistoryActionRef.current) {
        saveState();
      }
    };

    fabricCanvas.on('object:modified', onObjectModified);
    fabricCanvas.on('object:added', onObjectAdded);
    fabricCanvas.on('object:removed', onObjectRemoved);

    return () => {
      if (upperEl && handleNativeTouchStart) {
        upperEl.removeEventListener('touchstart', handleNativeTouchStart);
      }
      fabricCanvas.off('object:modified', onObjectModified);
      fabricCanvas.off('object:added', onObjectAdded);
      fabricCanvas.off('object:removed', onObjectRemoved);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [page.id, page.orientation, width, height, settings.inputMode]);

  // Handle undo/redo/clear triggers from parent
  useEffect(() => {
    if (undoTrigger && undoTrigger > 0) {
      handleUndo();
    }
  }, [undoTrigger, handleUndo]);

  useEffect(() => {
    if (redoTrigger && redoTrigger > 0) {
      handleRedo();
    }
  }, [redoTrigger, handleRedo]);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0 && fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = 'transparent';
      fabricCanvasRef.current.renderAll();
      saveState();
    }
  }, [clearTrigger, saveState]);

  // Update Tool & Brush settings when settings change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset interaction modes
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';

    if (settings.tool === 'select' || settings.tool === 'lasso') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    } else if (settings.tool === 'pen') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.color = settings.strokeColor;
      brush.width = settings.strokeWidth;
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush = brush;
    } else if (settings.tool === 'pencil') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      // Soft pencil appearance with slight opacity
      brush.color = settings.strokeColor;
      brush.width = Math.max(1, settings.strokeWidth * 0.8);
      canvas.freeDrawingBrush = brush;
    } else if (settings.tool === 'highlighter') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      // Convert hex to semi-transparent rgba for highlighter
      const hex = settings.strokeColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2) || '250', 16);
      const g = parseInt(hex.substring(2, 4) || '204', 16);
      const b = parseInt(hex.substring(4, 6) || '21', 16);
      brush.color = `rgba(${r}, ${g}, ${b}, ${settings.opacity || 0.4})`;
      brush.width = Math.max(12, settings.strokeWidth * 3);
      brush.strokeLineCap = 'square';
      canvas.freeDrawingBrush = brush;
    } else if (settings.tool === 'eraser') {
      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;
      // Object-level eraser: clicking or hovering over objects removes them
    } else if (settings.tool === 'pan') {
      canvas.defaultCursor = 'grab';
    } else if (settings.tool === 'shape') {
      canvas.defaultCursor = 'crosshair';
    } else if (settings.tool === 'text') {
      canvas.defaultCursor = 'text';
    }
  }, [settings.tool, settings.strokeColor, settings.strokeWidth, settings.opacity]);

  // Handle external image insertion onto the canvas
  const insertImageFile = useCallback((file: File) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      fabric.Image.fromURL(dataUrl, (img) => {
        // Scale down if image is huge
        const maxWidth = width * 0.6;
        if (img.width && img.width > maxWidth) {
          img.scale(maxWidth / img.width);
        }

        img.set({
          left: width / 2 - (img.getScaledWidth() / 2),
          top: height / 2 - (img.getScaledHeight() / 2),
          cornerColor: '#4F46E5',
          cornerStyle: 'circle',
          borderColor: '#4F46E5',
          cornerSize: 10,
          transparentCorners: false,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveState();
      });
    };
    reader.readAsDataURL(file);
  }, [width, height, saveState]);

  // Pointer & Touch Events (Stylus Pressure, Palm Rejection, Eraser, Shapes, Text)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Stylus pressure handler
    const handlePointerDown = (opt: any) => {
      const originalEvent = opt.e as PointerEvent;

      // In Single Mode: click toggles Pen Down / Pen Up (or lifts pen)
      if (settings.drawMode === 'single' && ['pen', 'pencil', 'highlighter'].includes(settings.tool)) {
        const brush = canvas.freeDrawingBrush as any;
        if (isSingleDrawingActiveRef.current && brush) {
          brush.onMouseUp({ e: opt.e });
          (canvas as any)._isCurrentlyDrawing = false;
          isSingleDrawingActiveRef.current = false;
          saveState();
        }
        isSinglePenDownRef.current = !isSinglePenDownRef.current;
        return;
      }

      // Stylus pressure check
      if (
        settings.isPressureSensitive &&
        originalEvent &&
        originalEvent.pressure &&
        originalEvent.pressure > 0 &&
        canvas.freeDrawingBrush
      ) {
        const pressure = originalEvent.pressure;
        const baseWidth =
          settings.tool === 'highlighter'
            ? Math.max(12, settings.strokeWidth * 3)
            : settings.strokeWidth;
        canvas.freeDrawingBrush.width = Math.max(1, baseWidth * (0.4 + pressure * 1.2));
      }

      // Tool: Eraser
      if (settings.tool === 'eraser' && opt.target) {
        canvas.remove(opt.target);
        canvas.renderAll();
        saveState();
        return;
      }

      // Tool: Text
      if (settings.tool === 'text') {
        const pointer = canvas.getPointer(opt.e);
        const textObj = new fabric.IText('Click here to type notes...', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: settings.fontFamily || 'Inter',
          fontSize: settings.fontSize || 18,
          fill: settings.strokeColor,
          selectable: true,
          editable: true,
        });

        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        textObj.enterEditing();
        textObj.selectAll();
        canvas.renderAll();
        saveState();
        return;
      }

      // Tool: Shapes
      if (settings.tool === 'shape') {
        isDrawingShapeRef.current = true;
        const pointer = canvas.getPointer(opt.e);
        shapeOriginRef.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.Object;
        const strokeColor = settings.strokeColor;
        const strokeWidth = settings.strokeWidth;
        const fillColor = settings.fillColor !== 'transparent' ? settings.fillColor : 'transparent';

        switch (settings.shapeType) {
          case 'circle':
            shape = new fabric.Circle({
              left: pointer.x,
              top: pointer.y,
              originX: 'center',
              originY: 'center',
              radius: 1,
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              fill: fillColor,
            });
            break;
          case 'triangle':
            shape = new fabric.Triangle({
              left: pointer.x,
              top: pointer.y,
              width: 1,
              height: 1,
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              fill: fillColor,
            });
            break;
          case 'line':
            shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              strokeLineCap: 'round',
            });
            break;
          case 'arrow':
            shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              strokeLineCap: 'round',
            });
            break;
          case 'rectangle':
          default:
            shape = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 1,
              height: 1,
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              fill: fillColor,
              rx: 4,
              ry: 4,
            });
            break;
        }

        activeShapeRef.current = shape;
        canvas.add(shape);
      }
    };

    const handlePointerMove = (opt: any) => {
      const originalEvent = opt.e as PointerEvent;

      // In Single Mode: Moving mouse/cursor draws automatically without holding button
      if (
        settings.drawMode === 'single' &&
        ['pen', 'pencil', 'highlighter'].includes(settings.tool) &&
        canvas.freeDrawingBrush &&
        isSinglePenDownRef.current
      ) {
        const pointer = canvas.getPointer(opt.e);
        const brush = canvas.freeDrawingBrush as any;

        if (!isSingleDrawingActiveRef.current) {
          (canvas as any)._isCurrentlyDrawing = true;
          brush.onMouseDown(pointer, { e: opt.e });
          isSingleDrawingActiveRef.current = true;
        } else {
          brush.onMouseMove(pointer, { e: opt.e });
        }

        if (singleStrokeTimerRef.current) {
          clearTimeout(singleStrokeTimerRef.current);
        }
        singleStrokeTimerRef.current = setTimeout(() => {
          if (isSingleDrawingActiveRef.current && canvas.freeDrawingBrush) {
            (canvas.freeDrawingBrush as any).onMouseUp({ e: opt.e });
            (canvas as any)._isCurrentlyDrawing = false;
            isSingleDrawingActiveRef.current = false;
            saveState();
          }
        }, 350);
      }

      // Dynamic pressure sensitivity during stroke
      if (
        settings.isPressureSensitive &&
        originalEvent &&
        originalEvent.pressure &&
        originalEvent.pressure > 0 &&
        canvas.isDrawingMode &&
        canvas.freeDrawingBrush
      ) {
        const pressure = originalEvent.pressure;
        const baseWidth =
          settings.tool === 'highlighter'
            ? Math.max(12, settings.strokeWidth * 3)
            : settings.strokeWidth;
        canvas.freeDrawingBrush.width = Math.max(1, baseWidth * (0.4 + pressure * 1.2));
      }

      // Drag eraser over objects
      if (settings.tool === 'eraser' && opt.target) {
        canvas.remove(opt.target);
        canvas.renderAll();
        return;
      }

      // Updating shape preview while dragging
      if (isDrawingShapeRef.current && activeShapeRef.current && shapeOriginRef.current) {
        const pointer = canvas.getPointer(opt.e);
        const origX = shapeOriginRef.current.x;
        const origY = shapeOriginRef.current.y;
        const shape = activeShapeRef.current;

        if (shape instanceof fabric.Rect || shape instanceof fabric.Triangle) {
          const w = Math.abs(origX - pointer.x);
          const h = Math.abs(origY - pointer.y);
          shape.set({
            left: Math.min(origX, pointer.x),
            top: Math.min(origY, pointer.y),
            width: w,
            height: h,
          });
        } else if (shape instanceof fabric.Circle) {
          const radius = Math.sqrt(
            Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2)
          ) / 2;
          shape.set({
            left: (origX + pointer.x) / 2,
            top: (origY + pointer.y) / 2,
            radius: Math.max(2, radius),
          });
        } else if (shape instanceof fabric.Line) {
          shape.set({
            x2: pointer.x,
            y2: pointer.y,
          });
        }

        shape.setCoords();
        canvas.renderAll();
      }
    };

    const handlePointerUp = (opt?: any) => {
      if (isDrawingShapeRef.current) {
        isDrawingShapeRef.current = false;
        // If it was an arrow shape, add arrowhead
        if (settings.shapeType === 'arrow' && activeShapeRef.current instanceof fabric.Line) {
          const line = activeShapeRef.current;
          const x1 = line.x1 || 0;
          const y1 = line.y1 || 0;
          const x2 = line.x2 || 0;
          const y2 = line.y2 || 0;
          const angle = Math.atan2(y2 - y1, x2 - x1);

          const headLen = Math.max(14, settings.strokeWidth * 4);
          const arrowHead = new fabric.Triangle({
            left: x2,
            top: y2,
            angle: (angle * 180) / Math.PI + 90,
            width: headLen,
            height: headLen,
            fill: settings.strokeColor,
            originX: 'center',
            originY: 'center',
          });

          const group = new fabric.Group([line, arrowHead]);
          canvas.remove(line);
          canvas.add(group);
        }

        activeShapeRef.current = null;
        shapeOriginRef.current = null;
        saveState();
      }

      // Finalize Single Mode stroke if finger/mouse was released
      if (settings.drawMode === 'single' && isSingleDrawingActiveRef.current && canvas.freeDrawingBrush) {
        (canvas.freeDrawingBrush as any).onMouseUp({ e: opt?.e });
        (canvas as any)._isCurrentlyDrawing = false;
        isSingleDrawingActiveRef.current = false;
        saveState();
      }
    };

    const handleMouseOut = (opt: any) => {
      if (settings.drawMode === 'single' && isSingleDrawingActiveRef.current && canvas.freeDrawingBrush) {
        (canvas.freeDrawingBrush as any).onMouseUp({ e: opt?.e });
        (canvas as any)._isCurrentlyDrawing = false;
        isSingleDrawingActiveRef.current = false;
        saveState();
      }
    };

    canvas.on('mouse:down', handlePointerDown);
    canvas.on('mouse:move', handlePointerMove);
    canvas.on('mouse:up', handlePointerUp);
    canvas.on('mouse:out', handleMouseOut);

    // Listen to global image insert event
    const handleInsertImageEvent = (e: any) => {
      if (e.detail?.file) {
        insertImageFile(e.detail.file);
      }
    };
    window.addEventListener('smartnote:insert-image', handleInsertImageEvent);

    return () => {
      canvas.off('mouse:down', handlePointerDown);
      canvas.off('mouse:move', handlePointerMove);
      canvas.off('mouse:up', handlePointerUp);
      canvas.off('mouse:out', handleMouseOut);
      window.removeEventListener('smartnote:insert-image', handleInsertImageEvent);
    };
  }, [
    settings.tool,
    settings.shapeType,
    settings.strokeColor,
    settings.fillColor,
    settings.strokeWidth,
    settings.isPressureSensitive,
    settings.fontSize,
    settings.fontFamily,
    settings.drawMode,
    saveState,
    insertImageFile,
  ]);

  // Support Drag and Drop files onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        insertImageFile(file);
      }
    }
  };

  // Render Background Paper Canvas (underneath fabric canvas)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;

    bgCanvas.width = width;
    bgCanvas.height = height;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw paper background template
    drawPaperTemplate(ctx, width, height, page.backgroundType, page.backgroundColor);

    // 2. Draw imported PDF background image if present
    if (page.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = page.backgroundImage;
    }
  }, [page.backgroundType, page.backgroundColor, page.backgroundImage, width, height]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-4 md:p-8 select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* A4 Paper Workspace Container */}
      <div
        className="relative bg-white shadow-paper-lg transition-transform duration-100 ease-out origin-top border border-slate-200/80 rounded-sm"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoom})`,
          touchAction: (settings.palmRejection || settings.inputMode === 'tablet') ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {/* Layer 1: Background Template / PDF Page */}
        <canvas
          ref={bgCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Single Mode Active Indicator */}
        {settings.drawMode === 'single' && ['pen', 'pencil', 'highlighter'].includes(settings.tool) && (
          <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-indigo-600/90 text-white rounded-full text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Single Mode: Move to Draw (Click to Lift / Drop Pen)</span>
          </div>
        )}

        {/* Layer 2: Interactive Fabric Vector Canvas */}
        <div className="absolute inset-0 z-10">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
