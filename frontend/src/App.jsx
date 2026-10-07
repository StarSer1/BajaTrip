import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const titles = {
  '/': 'BajaTrip',
  '/catalogo': 'Catálogo de experiencias | BajaTrip',
  '/galeria': 'Galería | BajaTrip',
  '/mis-viajes': 'Mis viajes | BajaTrip',
};

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = titles[pathname] ?? 'Página no encontrada | BajaTrip';
  }, [pathname]);
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="catalogo" element={<CatalogPage />} />
      <Route path="galeria" element={<GalleryPage />} />
      <Route path="mis-viajes" element={<TripsPage />} />
      <Route path="index.html" element={<Navigate to={`/${hash}`} replace />} />
      <Route path="pages/catalogo.html" element={<Navigate to="/catalogo" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
