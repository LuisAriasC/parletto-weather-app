import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { MainPanel } from './layout/MainPanel';
import { ErrorBoundary, Toast } from '../shared/components';
import { RootState } from './store';

export function App() {
  const recents = useSelector((s: RootState) => s.search.recents);
  const [location, setLocation] = useState(recents[0]?.query ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onLocationSelect={setLocation} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <MainPanel location={location} />
          </ErrorBoundary>
        </main>
      </div>
      <Toast />
    </div>
  );
}

export default App;
