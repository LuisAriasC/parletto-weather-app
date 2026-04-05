import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { MainPanel } from './layout/MainPanel';
import { ErrorBoundary, Toast } from '../shared/components';
import { RootState } from './store';

export interface LocationEntry {
  label: string;
  query: string;
}

export function App() {
  const recents = useSelector((s: RootState) => s.search.recents);
  const [locationEntry, setLocationEntry] = useState<LocationEntry | null>(
    recents[0] ? { label: recents[0].label, query: recents[0].query } : null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onLocationSelect={setLocationEntry} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <MainPanel locationEntry={locationEntry} />
          </ErrorBoundary>
        </main>
      </div>
      <Toast />
    </div>
  );
}

export default App;
