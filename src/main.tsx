import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import ListenPage from './pages/ListenPage';
import BrowsePage from './pages/BrowsePage';
import SettingsPage from './pages/SettingsPage';
import { LibraryProvider } from './store/libraryStore';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LibraryProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<ListenPage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </LibraryProvider>
  </StrictMode>
);
