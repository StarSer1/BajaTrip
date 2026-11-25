import { useEffect, useState } from 'react';
import { usuariosAdmin } from '../storage/cuenta.js';
import { mensajeDeError } from '../storage/servidor.js';

// El enlace a esta página solo aparece para administradores, pero eso es comodidad, no seguridad:
// quien escriba /admin a mano recibe 401 o 403 del servidor (backend/server.js, /api/admin/usuarios).
export default function AdminPage() {
  const [estado, setEstado] = useState({ cargando: true });
  useEffect(() => {
    usuariosAdmin().then((respuesta) => setEstado(respuesta?.ok ? { usuarios: respuesta.datos } : { error: mensajeDeError(respuesta) }));
  }, []);
  return <div className="wrap section page-content">
    <header className="page-intro"><p className="eyebrow">ADMINISTRACIÓN</p><h1>Cuentas registradas</h1></header>
    {estado.cargando && <p role="status">Cargando…</p>}
    {estado.error && <p className="form-error" role="alert">{estado.error}</p>}
    {estado.usuarios && <div className="admin-scroll"><table className="admin-table">
      <thead><tr><th scope="col">#</th><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Alta</th></tr></thead>
      <tbody>{estado.usuarios.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.nombre}</td><td>{u.correo}</td><td>{u.rol}</td><td>{u.creadoEn.slice(0, 10)}</td></tr>)}</tbody>
    </table></div>}
  </div>;
}
