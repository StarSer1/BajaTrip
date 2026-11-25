import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { entrar } from '../storage/cuenta.js';
import { mensajeDeError } from '../storage/servidor.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setEnviando(true);
    setError('');
    const respuesta = await entrar({ correo: form.elements.correo.value, contrasena: form.elements.contrasena.value });
    setEnviando(false);
    if (respuesta?.ok) return navigate('/cuenta');
    form.elements.contrasena.value = '';
    setError(mensajeDeError(respuesta));
  }

  return <div className="wrap section page-content auth-page">
    <header className="page-intro"><p className="eyebrow">TU CUENTA</p><h1>Iniciar sesión</h1></header>
    <form className="auth-form" onSubmit={enviar}>
      <label className="field">Correo electrónico
        <input type="email" name="correo" autoComplete="email" required maxLength={254} />
      </label>
      <label className="field">Contraseña
        <input type="password" name="contrasena" autoComplete="current-password" required maxLength={72} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button">Entrar</button>
      <p>¿No tienes cuenta? <Link to="/registro">Crea una</Link></p>
    </form>
  </div>;
}
