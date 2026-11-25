import { useEffect, useRef } from 'react';

// Captcha de Cloudflare Turnstile. El script viene de challenges.cloudflare.com, que es el único
// origen externo de scripts que permite la CSP. Casi siempre se resuelve solo, sin pedir nada;
// el servidor verifica el token (backend/modules/auth/captcha.js), no el navegador.
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let cargando;

function cargarScript() {
  cargando ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => { cargando = undefined; reject(new Error('turnstile')); };
    document.head.append(script);
  });
  return cargando;
}

export default function Turnstile({ sitekey, onToken, reinicio }) {
  const contenedor = useRef(null);
  useEffect(() => {
    if (!sitekey) return undefined;
    let id;
    let vigente = true;
    cargarScript().then((turnstile) => {
      if (!vigente) return;
      id = turnstile.render(contenedor.current, {
        sitekey,
        language: 'es',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    }).catch(() => onToken(''));
    return () => { vigente = false; if (id !== undefined) window.turnstile?.remove(id); };
  }, [sitekey, reinicio]);
  return <div className="captcha" ref={contenedor} />;
}
