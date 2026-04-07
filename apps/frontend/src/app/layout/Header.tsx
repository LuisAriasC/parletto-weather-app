import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, Menu, Thermometer } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { toggleTheme } from '../../shared/store/themeSlice';
import { toggleUnits } from '../../shared/store/settingsSlice';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.theme);
  const units = useSelector((s: RootState) => s.settings.units);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Palmetto
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch(toggleUnits())}
          aria-label="Toggle temperature units"
        >
          {units === 'imperial' ? '°F' : '°C'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleTheme())}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </header>
  );
}
