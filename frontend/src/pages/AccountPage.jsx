import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useCuenta from '../hooks/useCuenta.js';
import { salir, subirFoto } from '../storage/cuenta.js';
import { mensajeDeError } from '../storage/servidor.js';

export default function AccountPage() {
  const { estado, usuario } = useCuenta();
  const navigate = useNavigate();
  const archivo = useRef(null);
  const [aviso, setAviso] = useState({ error: '', listo: '' });
  // Cambia la dirección de la imagen después de subir una nueva, para no ver la anterior.
  const [version, setVersion] = useState(0);
  useEffect(() => { if (usuario?.foto) setVersion(Date.now()); }, [usuario?.foto]);

  if (estado === 'cargando') return <div className="wrap section page-content"><p role="status">Cargando tu cuenta…</p></div>;
  if (!usuario) return <Navigate to="/entrar" replace />;

  async function enviarFoto(event) {
    event.preventDefault();
    const elegido = archivo.current.files[0];
    if (!elegido) return setAviso({ error: 'Elige una foto.', listo: '' });
    const respuesta = await subirFoto(elegido);
    archivo.current.value = '';
    if (respuesta?.ok) {
      setAviso({ error: '', listo: 'Foto actualizada.' });
      setVersion(Date.now());
    } else {
      setAviso({ error: mensajeDeError(respuesta), listo: '' });
    }
  }

  async function cerrar() {
    await salir();
    navigate('/');
  }

  return <div className="wrap section page-content auth-page">
    <header className="page-intro"><p className="eyebrow">TU CUENTA</p><h1>Hola, {usuario.nombre}</h1><p>{usuario.correo}</p></header>
    <section className="auth-form" aria-labelledby="titulo-foto">
      <h2 id="titulo-foto">Foto de perfil</h2>
      {version > 0 && <img className="profile-photo" src={`/api/cuenta/foto?v=${version}`} alt="Tu foto de perfil" width="160" height="160" />}
      <form onSubmit={enviarFoto}>
        <label className="field">Elige una foto (JPG, PNG o WebP, hasta 2 MB)
          <input type="file" name="foto" ref={archivo} accept="image/jpeg,image/png,image/webp" />
        </label>
        {aviso.error && <p className="form-error" role="alert">{aviso.error}</p>}
        {aviso.listo && <p className="form-ok" role="status">{aviso.listo}</p>}
        <button className="button">Subir foto</button>
      </form>
    </section>
    <section className="section auth-links">
      <Link className="button button--secundario" to="/mis-viajes">Mis viajes</Link>
      {usuario.rol === 'admin' && <Link className="button button--secundario" to="/admin">Panel de administración</Link>}
      <button type="button" className="button button--peligro" onClick={cerrar}>Cerrar sesión</button>
    </section>
  </div>;
}
