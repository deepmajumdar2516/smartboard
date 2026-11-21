import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { NotebookEditor } from './components/editor/NotebookEditor';
import { seedInitialDataIfNeeded } from './lib/db';

export const App: React.FC = () => {
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Seed initial guide & tutorial notebook and subjects
    seedInitialDataIfNeeded()
      .catch((err) => console.error('Failed to seed initial data:', err))
      .finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m18 2 4 4-14 14H4v-4L18 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 5.5 4 4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading SmartNote Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {activeNotebookId ? (
        <NotebookEditor
          notebookId={activeNotebookId}
          onBackToDashboard={() => setActiveNotebookId(null)}
        />
      ) : (
        <Dashboard onOpenNotebook={(id) => setActiveNotebookId(id)} />
      )}
    </div>
  );
};

export default App;
