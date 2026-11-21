import React, { useState, useRef } from 'react';
import {
  MousePointer,
  Pen,
  Pencil,
  Highlighter,
  Eraser,
  Shapes,
  Type,
  ImagePlus,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Shield,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Star,
  ChevronDown,
  Palette,
  Sliders,
  Expand,
  FileSpreadsheet,
  Tablet,
  Mouse,
} from 'lucide-react';
import { DrawingSettings, ToolType, ShapeType, BackgroundTemplateType } from '../../types';
import { TEMPLATE_OPTIONS } from '../../lib/paperTemplates';

interface WritingToolbarProps {
  settings: DrawingSettings;
  onUpdateSettings: (newSettings: Partial<DrawingSettings>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearPage: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitPage: () => void;
  onFitWidth: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  currentTemplate: BackgroundTemplateType;
  onChangeTemplate: (template: BackgroundTemplateType) => void;
  onInsertImage: (file: File) => void;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#334155', // Slate
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#FFFFFF', // White
];

const STROKE_WIDTH_PRESETS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Bold', value: 8 },
  { label: 'Marker', value: 16 },
];

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  settings,
  onUpdateSettings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearPage,
  zoom,
  onZoomChange,
  onFitPage,
  onFitWidth,
  isFullscreen,
  onToggleFullscreen,
  currentTemplate,
  onChangeTemplate,
  onInsertImage,
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'color' | 'thickness' | 'shapes' | 'text' | 'template'>('none');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleMenu = (menu: 'color' | 'thickness' | 'shapes' | 'text' | 'template') => {
    setActiveMenu((prev) => (prev === menu ? 'none' : menu));
  };

  const handleToolSelect = (tool: ToolType) => {
    onUpdateSettings({ tool });
    setActiveMenu('none');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onInsertImage(e.target.files[0]);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] select-none">
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Floating Island */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-paper-lg transition-all">
        {/* Tool: Select / Lasso */}
        <button
          onClick={() => handleToolSelect('select')}
          title="Select & Move Objects (V)"
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${
            settings.tool === 'select'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MousePointer className="w-5 h-5" />
        </button>

        {/* Tool: Pen */}
        <button
          onClick={() => handleToolSelect('pen')}
          title="Ballpoint Pen (P)"
          className={`p-2.5 rounded-xl transition flex items-center justify-center relative ${
            settings.tool === 'pen'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Pen className="w-5 h-5" />
          <span
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
            style={{ backgroundColor: settings.strokeColor }}
          />
        </button>

        {/* Tool: Pencil */}
        <button
          onClick={() => handleToolSelect('pencil')}
          title="Sketch Pencil"
          className={`p-2.5 rounded-xl transition flex items-center justify-center relative ${
            settings.tool === 'pencil'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Pencil className="w-5 h-5" />
        </button>

        {/* Tool: Highlighter */}
        <button
          onClick={() => handleToolSelect('highlighter')}
          title="Highlighter (H)"
          className={`p-2.5 rounded-xl transition flex items-center justify-center relative ${
            settings.tool === 'highlighter'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Highlighter className="w-5 h-5" />
          <span
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
            style={{ backgroundColor: settings.strokeColor }}
          />
        </button>

        {/* Tool: Eraser */}
        <button
          onClick={() => handleToolSelect('eraser')}
          title="Eraser (E) - Click or drag across objects to erase"
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${
            settings.tool === 'eraser'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Eraser className="w-5 h-5" />
        </button>

        {/* Tool: Shapes Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('shapes')}
            title="Geometric Shapes & Arrows"
            className={`p-2.5 rounded-xl transition flex items-center gap-1 ${
              settings.tool === 'shape' || activeMenu === 'shapes'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {settings.shapeType === 'rectangle' && <Square className="w-5 h-5" />}
            {settings.shapeType === 'circle' && <Circle className="w-5 h-5" />}
            {settings.shapeType === 'triangle' && <Triangle className="w-5 h-5" />}
            {settings.shapeType === 'arrow' && <ArrowRight className="w-5 h-5" />}
            {settings.shapeType === 'line' && <Minus className="w-5 h-5" />}
            {settings.shapeType === 'star' && <Star className="w-5 h-5" />}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Shapes Dropdown */}
          {activeMenu === 'shapes' && (
            <div className="absolute top-full mt-2 left-0 p-2 bg-white rounded-xl shadow-paper-lg border border-slate-200/80 grid grid-cols-3 gap-1.5 w-48 z-50 animate-in fade-in zoom-in-95">
              {[
                { type: 'rectangle' as ShapeType, label: 'Rect', icon: Square },
                { type: 'circle' as ShapeType, label: 'Circle', icon: Circle },
                { type: 'triangle' as ShapeType, label: 'Triangle', icon: Triangle },
                { type: 'line' as ShapeType, label: 'Line', icon: Minus },
                { type: 'arrow' as ShapeType, label: 'Arrow', icon: ArrowRight },
                { type: 'star' as ShapeType, label: 'Star', icon: Star },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    onUpdateSettings({ tool: 'shape', shapeType: item.type });
                    setActiveMenu('none');
                  }}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition ${
                    settings.shapeType === item.type && settings.tool === 'shape'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tool: Text Box */}
        <button
          onClick={() => {
            handleToolSelect('text');
            toggleMenu('text');
          }}
          title="Add Text (T)"
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${
            settings.tool === 'text'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Tool: Image Insertion */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image from Device"
          className="p-2.5 rounded-xl transition text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center"
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Color Palette Picker Popover */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('color')}
            title="Stroke Color & Palette"
            className="p-2 rounded-xl transition flex items-center gap-1.5 hover:bg-slate-100"
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-slate-300 shadow-sm"
              style={{ backgroundColor: settings.strokeColor }}
            />
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {activeMenu === 'color' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-3 bg-white rounded-2xl shadow-paper-lg border border-slate-200/80 w-64 z-50 animate-in fade-in">
              <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Palette Colors
              </div>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onUpdateSettings({ strokeColor: color });
                      setActiveMenu('none');
                    }}
                    className={`w-7 h-7 rounded-full transition transform hover:scale-110 border ${
                      settings.strokeColor === color
                        ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                        : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Custom Color</span>
                <input
                  type="color"
                  value={settings.strokeColor}
                  onChange={(e) => onUpdateSettings({ strokeColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stroke Thickness / Settings Popover */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('thickness')}
            title="Stroke Thickness & Opacity"
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-700">{settings.strokeWidth}px</span>
          </button>

          {activeMenu === 'thickness' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-4 bg-white rounded-2xl shadow-paper-lg border border-slate-200/80 w-64 z-50 animate-in fade-in space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Stroke Width</span>
                  <span className="font-semibold text-indigo-600">{settings.strokeWidth} px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={settings.strokeWidth}
                  onChange={(e) => onUpdateSettings({ strokeWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  {STROKE_WIDTH_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onUpdateSettings({ strokeWidth: p.value })}
                      className={`px-2 py-1 text-xs rounded-md font-medium transition ${
                        settings.strokeWidth === p.value
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Stroke Opacity</span>
                  <span className="font-semibold text-indigo-600">
                    {Math.round(settings.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) => onUpdateSettings({ opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Stylus Pressure</span>
                <button
                  onClick={() =>
                    onUpdateSettings({ isPressureSensitive: !settings.isPressureSensitive })
                  }
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                    settings.isPressureSensitive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{settings.isPressureSensitive ? 'Active' : 'Off'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paper Template Selector */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('template')}
            title="Change Paper Template (Ruled, Grid, Graph, etc.)"
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {activeMenu === 'template' && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-2 bg-white rounded-2xl shadow-paper-lg border border-slate-200/80 w-60 z-50 animate-in fade-in space-y-1">
              <div className="text-xs font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">
                Paper Templates
              </div>
              {TEMPLATE_OPTIONS.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onChangeTemplate(tmpl.id);
                    setActiveMenu('none');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left text-xs transition ${
                    currentTemplate === tmpl.id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{tmpl.name}</span>
                  <span
                    className="w-4 h-4 rounded border border-slate-300"
                    style={{ backgroundColor: tmpl.previewColor }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Draw Mode Switcher: Single (Move to Draw) vs Double (Click & Drag) */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => onUpdateSettings({ drawMode: 'single' })}
            title="Single Mode: Moving mouse or stylus draws automatically without holding the button! Click to lift or drop pen."
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              settings.drawMode === 'single'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>Single</span>
            <span className="text-[10px] hidden sm:inline opacity-85">(Move)</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ drawMode: 'double' })}
            title="Double Mode: Click and drag to draw (standard click & hold)."
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              settings.drawMode === 'double'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <span>Double</span>
            <span className="text-[10px] hidden sm:inline opacity-85">(Click & Drag)</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-2.5 rounded-xl transition ${
            canUndo
              ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-2.5 rounded-xl transition ${
            canRedo
              ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Clear Page Button */}
        <div className="relative">
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Clear Current Page"
            className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {showClearConfirm && (
            <div className="absolute top-full mt-2 right-0 p-3 bg-white rounded-xl shadow-paper-lg border border-rose-200 w-52 z-50 text-center animate-in fade-in">
              <p className="text-xs font-medium text-slate-700 mb-2">
                Clear all drawings on this page?
              </p>
              <div className="flex gap-1.5 justify-center">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearPage();
                    setShowClearConfirm(false);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-slate-600">
          <button
            onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={onFitPage}
            title="Click to reset to Fit Page"
            className="text-xs font-semibold px-1.5 py-1 rounded hover:bg-slate-100"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => onZoomChange(Math.min(3.0, zoom + 0.1))}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={onFitWidth}
            title="Fit Width"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-xs hidden md:block"
          >
            <Expand className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Writing Mode'}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
