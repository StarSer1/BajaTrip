import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import GuidesPage from './guides/GuidesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import ReservationPage from './pages/ReservationPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const titles = {
  '/': 'BajaTrip',
  '/catalogo': 'Catálogo de experiencias | BajaTrip',
  '/galeria': 'Galería | BajaTrip',
  '/mis-viajes': 'Mis viajes | BajaTrip',
  '/guias': 'Guías locales | BajaTrip',
  '/entrar': 'Iniciar sesión | BajaTrip',
  '/registro': 'Crear cuenta | BajaTrip',
  '/cuenta': 'Mi cuenta | BajaTrip',
  '/admin': 'Administración | BajaTrip',
};

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = titles[pathname] ?? (pathname.startsWith('/mis-viajes/reserva/') ? 'Reserva | BajaTrip' : 'Página no encontrada | BajaTrip');
  }, [pathname]);
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="catalogo" element={<CatalogPage />} />
      <Route path="galeria" element={<GalleryPage />} />
      <Route path="mis-viajes" element={<TripsPage />} />
      <Route path="mis-viajes/reserva/:id" element={<ReservationPage />} />
      <Route path="guias" element={<GuidesPage />} />
      <Route path="entrar" element={<LoginPage />} />
      <Route path="registro" element={<RegisterPage />} />
      <Route path="cuenta" element={<AccountPage />} />
      <Route path="admin" element={<AdminPage />} />
      <Route path="index.html" element={<Navigate to={`/${hash}`} replace />} />
      <Route path="pages/catalogo.html" element={<Navigate to="/catalogo" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
