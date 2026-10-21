import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../assets/css/landing.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>,
);

// El service worker solo se registra en la compilación (npm run build): en desarrollo Vite
// sirve los módulos sueltos con recarga en caliente y una caché los dejaría desactualizados.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sin service worker la página sigue funcionando en línea */ });
  });
}
