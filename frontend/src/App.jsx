import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = pathname === '/' ? 'BajaTrip' : pathname === '/catalogo' ? 'Catálogo de experiencias | BajaTrip' : 'BajaTrip';
  }, [pathname]);
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="catalogo" element={<CatalogPage />} />
      <Route path="index.html" element={<Navigate to={`/${hash}`} replace />} />
      <Route path="pages/catalogo.html" element={<Navigate to="/catalogo" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
