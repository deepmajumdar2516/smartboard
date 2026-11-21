# SmartNote — Professional Smart Digital Whiteboard & Notes Application

SmartNote is a modern, responsive digital study notebook and whiteboard application built for students, researchers, and professionals. Inspired by Goodnotes, Notability, and Microsoft OneNote, SmartNote provides a realistic A4-sized digital paper workspace with low-latency stylus and touch handwriting, vector diagramming, mathematical problem solving, multi-page organization, PDF annotation, and 1-click multi-page A4 PDF export.

---


# Live Link - https://deepmajumdar2516.github.io/smartboard/

## 🚀 Key Features

### 1. Realistic A4 Digital Paper Workspace
- **True A4 Proportions**: 210 mm × 297 mm with exact aspect ratio preserved at all zoom levels.
- **Dual Orientations**: Seamlessly toggle between Portrait and Landscape modes per notebook or per page.
- **8 Built-in Paper Templates**:
  - **Plain White**: Clean unblemished canvas.
  - **Ruled Notebook**: Standard notebook lines with left red margin.
  - **College Ruled**: Narrow spacing for dense note-taking.
  - **Grid Paper**: Precise square grid for math and coordinate graphing.
  - **Engineering Graph Paper**: Millimeter and accented grid lines.
  - **Dotted Paper**: Bullet-journal style dot grid.
  - **Warm Cream**: Soft eye-friendly ivory tone.
  - **Dark Slate**: High-contrast dark chalkboard mode.
- **Workspace Navigation**:
  - Smooth Zoom In / Zoom Out (from 30% to 300%).
  - 1-Click "Fit to Page" and "Fit to Width".
  - Fullscreen distraction-free writing mode.

---

### 2. Smooth Handwriting & Vector Drawing Engine
- **Stylus & Touch First**: Active stylus pressure sensitivity scaling pen strokes dynamically.
- **Palm Rejection**: Disables accidental gestures and page scrolling while writing.
- **Rich Toolset**:
  - **Pen**: Smooth ballpoint pen with custom thickness and solid stroke.
  - **Pencil**: Soft textured pencil brush for sketching.
  - **Highlighter**: Semi-transparent marker with blend overlay ensuring text and handwriting underneath remain legible.
  - **Eraser**: Fast object & stroke eraser.
  - **Shapes**: Rectangle, Circle, Triangle, Star, Straight Line, and Directional Arrow with automatic arrowheads.
  - **Text Box**: Editable rich text boxes with custom typography (`Inter`, `Caveat` handwriting, `JetBrains Mono` code/math).
  - **Image Insertion**: Upload and insert photos, graphs, diagrams, and textbook screenshots directly from your device or drag-and-drop.
  - **Lasso & Selection**: Move, scale, rotate, duplicate, and delete canvas objects.
  - **Undo & Redo**: Deep history stack with `Ctrl+Z` and `Ctrl+Y` keyboard shortcuts.
  - **Clear Page**: Quick page clear with confirmation.

---

### 3. Multi-Page Notebook Management
- **Add Unlimited A4 Pages**: Appends new pages with matching or custom templates.
- **Insert Pages**: Insert a new page before or after any existing page.
- **Duplicate & Delete**: Duplicate pages or delete pages with safety confirmation.
- **Drag & Reorder**: Move pages up or down easily.
- **Thumbnail Sidebar**: Collapsible drawer showing live previews of all pages with page numbers.
- **Per-Page Templates**: Different background templates and orientations within the same notebook.

---

### 4. Open, Annotate & Edit Existing PDFs
- **Open Any PDF**: Upload lecture slides, past exams, textbooks, or research papers.
- **High-Resolution Page Extraction**: Uses `pdfjs-dist` to render PDF pages as crisp background layers.
- **Annotate Directly**: Highlight text, write notes, solve equations, and circle key figures.
- **Insert New Blank / Ruled Pages**: Add new blank or ruled A4 note pages between original PDF pages.
- **Non-Destructive Layers**: Annotations are stored as separate structured vector layers, never permanently flattening the working document.

---

### 5. Multi-Page A4 PDF Export System
- **1-Click Export**: Compiles all notebook pages into a single standardized A4 PDF file using `jspdf`.
- **Exact Vector Fidelity**: Preserves handwriting, drawings, shapes, text, images, and backgrounds at crisp resolution.
- **Export Options**:
  - Export all pages or custom page ranges (e.g. `1-3, 5`).
  - Option to include or exclude paper background grids/ruled lines.
  - Custom file naming.
  - In-browser PDF preview before downloading.

---

### 6. Auto-Save & Cloud Synchronization
- **Offline-First Storage**: Powered by IndexedDB (`Dexie.js`) for instant zero-latency auto-saving and recovery after browser refreshes.
- **Supabase Cloud Sync**:
  - Ready-to-connect Supabase PostgreSQL database and Storage.
  - Syncs notebooks, pages, structured JSON canvas data, and folders across devices.
  - Complete SQL schema included in `supabase/schema.sql`.

---

### 7. Notebook Organization & Dashboard
- **Folders & Subjects**: Organize notes into subjects like Mathematics, Physics, Computer Science, etc.
- **Favorite & Star**: Pin important notebooks for instant access.
- **Search**: Search notes by title, subject, or description.
- **View Modes**: Switch between responsive Grid Cards and compact List View.
- **Notebook Actions**: Rename, duplicate, export PDF, move to folder, or delete.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18+ with TypeScript |
| **Bundler & Dev Server** | Vite |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Drawing Engine** | HTML5 Canvas + Fabric.js (`fabric@5.3.0`) |
| **Local Database** | Dexie.js (IndexedDB ORM) |
| **Cloud Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **PDF Rendering** | PDF.js (`pdfjs-dist`) |
| **PDF Generation** | jsPDF |

---

## 📁 Project Structure

```
whiteboard/
├── index.html                   # HTML entry point with web fonts & touch settings
├── package.json                 # Dependencies and build scripts
├── vite.config.ts               # Vite bundler configuration
├── tsconfig.json                # TypeScript compiler configuration
├── tailwind.config.js           # Tailwind color palette & typography
├── supabase/
│   └── schema.sql               # Supabase PostgreSQL schema with RLS policies
└── src/
    ├── main.tsx                 # React DOM mount
    ├── App.tsx                  # Root navigation state
    ├── index.css                # Tailwind directives & paper shadow styles
    ├── types/
    │   └── index.ts             # TypeScript interfaces for Notebooks, Pages, Tools
    ├── lib/
    │   ├── db.ts                # Dexie IndexedDB database & starter guide seeder
    │   ├── paperTemplates.ts    # A4 dimension calculations & 8 paper patterns
    │   ├── pdfImporter.ts       # PDF.js page extraction & notebook generator
    │   ├── pdfExporter.ts       # jsPDF multi-page A4 compilation & export
    │   └── supabase.ts          # Supabase client & bi-directional sync
    └── components/
        ├── dashboard/
        │   └── Dashboard.tsx    # Home page with folders, search, grid/list view
        ├── editor/
        │   ├── NotebookEditor.tsx        # Workspace header, autosave, & layout
        │   ├── WhiteboardCanvas.tsx      # Fabric.js drawing & stylus pressure engine
        │   ├── WritingToolbar.tsx        # Floating draggable tool palette
        │   └── PageThumbnailsSidebar.tsx # Collapsible multi-page manager
        └── modals/
            ├── NewNotebookModal.tsx      # Create notebook dialog
            ├── OpenPdfModal.tsx          # Upload & process PDF dialog
            ├── ExportPdfModal.tsx        # Multi-page A4 PDF exporter dialog
            └── SupabaseConfigModal.tsx   # Supabase connection & SQL setup dialog
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

### 3. Production Build
```bash
npm run build
```
Generates optimized production assets in `dist/`.

---

## ☁️ Supabase Setup (Optional)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the SQL code from [`supabase/schema.sql`](file:///c:/Users/asus/OneDrive/Desktop/whiteboard/supabase/schema.sql).
4. In the SmartNote application header, click **Cloud Setup** and enter your Supabase Project URL and Anon Key.
