import { pool } from '../shared/db.js';

// Da el rol de administrador a una cuenta que ya existe. No hay forma de hacerlo desde la página:
// solo quien tiene acceso al servidor puede.
//   En Docker: docker compose exec app1 node backend/scripts/admin.js correo@ejemplo.com
const correo = String(process.argv[2] ?? '').trim().toLowerCase();
if (!correo.includes('@')) {
  console.error('Uso: node backend/scripts/admin.js correo@ejemplo.com');
  process.exit(1);
}
const [resultado] = await pool.execute("UPDATE usuarios SET rol = 'admin' WHERE correo = ?", [correo]);
console.log(resultado.affectedRows > 0 ? 'Listo: la cuenta ahora es administradora.' : 'No hay ninguna cuenta con ese correo.');
await pool.end();
