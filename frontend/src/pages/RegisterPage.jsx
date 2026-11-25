import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Turnstile from '../components/Turnstile.jsx';
import { configuracion, registrar } from '../storage/cuenta.js';
import { mensajeDeError } from '../storage/servidor.js';

export default function RegisterPage() {
  const [sitekey, setSitekey] = useState(null);
  const [captcha, setCaptcha] = useState('');
  const [reinicio, setReinicio] = useState(0);
  const [estado, setEstado] = useState({ error: '', listo: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    configuracion().then((respuesta) => (respuesta?.ok
      ? setSitekey(respuesta.datos.turnstileSitekey)
      : setEstado({ error: mensajeDeError(respuesta), listo: '' })));
  }, []);

  // La marca de «no coinciden» se quita al escribir: si se quedara puesta, el navegador
  // bloquearía el envío y la comparación nunca se volvería a hacer.
  function limpiarConfirmacion(event) {
    event.currentTarget.form.elements.confirmar.setCustomValidity('');
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    const form = event.currentTarget;
    const { contrasena, confirmar } = form.elements;
    confirmar.setCustomValidity(confirmar.value === contrasena.value ? '' : 'Las contraseñas no coinciden.');
    if (!form.reportValidity()) return;
    if (!captcha) return setEstado({ error: 'Completa la verificación de que eres una persona.', listo: '' });
    setEnviando(true);
    const respuesta = await registrar({
      nombre: form.elements.nombre.value,
      correo: form.elements.correo.value,
      contrasena: contrasena.value,
      sitio: form.elements.sitio.value,
      captcha,
    });
    setEnviando(false);
    // Un token de Turnstile solo sirve una vez: se pide otro para el siguiente intento.
    setCaptcha('');
    setReinicio((n) => n + 1);
    if (respuesta?.ok) {
      form.reset();
      setEstado({ error: '', listo: respuesta.datos.mensaje });
    } else {
      setEstado({ error: mensajeDeError(respuesta), listo: '' });
    }
  }

  return <div className="wrap section page-content auth-page">
    <header className="page-intro"><p className="eyebrow">TU CUENTA</p><h1>Crear cuenta</h1><p>Con una cuenta, tus reservas de ejemplo te acompañan en cualquier dispositivo.</p></header>
    <form className="auth-form" onSubmit={enviar}>
      <label className="field">Nombre
        <input name="nombre" autoComplete="name" required minLength={2} maxLength={60} />
      </label>
      <label className="field">Correo electrónico
        <input type="email" name="correo" autoComplete="email" required maxLength={254} />
      </label>
      <label className="field">Contraseña
        <input type="password" name="contrasena" onInput={limpiarConfirmacion} autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="ayuda-contrasena" />
        <small id="ayuda-contrasena">De 8 a 72 caracteres. Una frase de varias palabras es fácil de recordar y difícil de adivinar.</small>
      </label>
      <label className="field">Confirma la contraseña
        <input type="password" name="confirmar" onInput={limpiarConfirmacion} autoComplete="new-password" required maxLength={72} />
      </label>
      {/* Campo trampa: oculto para las personas (y para lectores de pantalla); los programas lo llenan. */}
      <div className="trampa" aria-hidden="true">
        <label>Tu sitio web <input name="sitio" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Turnstile sitekey={sitekey} onToken={setCaptcha} reinicio={reinicio} />
      {estado.error && <p className="form-error" role="alert">{estado.error}</p>}
      {estado.listo && <p className="form-ok" role="status">{estado.listo} <Link to="/entrar">Iniciar sesión</Link></p>}
      <button className="button">Crear cuenta</button>
      <p>¿Ya tienes cuenta? <Link to="/entrar">Inicia sesión</Link></p>
    </form>
  </div>;
}
