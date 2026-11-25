-- Base de datos que comparten los nodos del backend (Prácticas 5 y 6).
-- El servidor ejecuta este archivo al arrancar: IF NOT EXISTS permite que los dos nodos lo intenten a la vez.
-- Si vienes de la Práctica 5, el esquema cambió: recrea el volumen con «docker compose down -v».

-- Cuentas. La contraseña nunca se guarda: solo su derivación con bcrypt (sal incluida, costo 12).
-- El rol se revisa en el servidor en cada petición; el navegador no puede cambiarlo.
CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  correo VARCHAR(254) NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  contrasena_hash CHAR(60) NOT NULL,
  rol ENUM('turista', 'admin') NOT NULL DEFAULT 'turista',
  -- Nombre al azar del archivo en el volumen de subidas, nunca el nombre que mandó el usuario.
  foto VARCHAR(41) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY usuarios_correo (correo)
) DEFAULT CHARSET = utf8mb4;

-- Una sesión por visitante. El navegador guarda un token al azar en una cookie HttpOnly y aquí
-- solo queda su huella SHA-256: con una copia de esta tabla no se puede suplantar a nadie.
-- Al iniciar sesión se crea una sesión nueva (otro token) y la anónima se borra.
CREATE TABLE IF NOT EXISTS sesiones (
  id CHAR(64) NOT NULL PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nodo_origen VARCHAR(40) NOT NULL,
  CONSTRAINT sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

-- Reservas de ejemplo. El id lo genera el navegador al guardarlas en IndexedDB: si un reintento
-- llega dos veces, a cualquiera de los nodos, la reserva no se duplica.
-- Dueño: la cuenta (usuario_id) o, si no hay cuenta, la sesión anónima (sesion_id).
-- Cerrar sesión borra la sesión pero no las reservas de la cuenta (ON DELETE SET NULL).
CREATE TABLE IF NOT EXISTS reservas (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sesion_id CHAR(64) NULL,
  usuario_id INT UNSIGNED NULL,
  experiencia_id VARCHAR(40) NOT NULL,
  fecha DATE NOT NULL,
  viajeros TINYINT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  nodo VARCHAR(40) NOT NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX reservas_por_sesion (sesion_id),
  INDEX reservas_por_usuario (usuario_id),
  CONSTRAINT reservas_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones (id) ON DELETE SET NULL,
  CONSTRAINT reservas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;

-- Límite de intentos (inicio de sesión y registro). Vive en la base y no en la memoria de un
-- nodo: si el balanceador manda cada intento a un servidor distinto, el contador es el mismo.
-- La clave es «entrar:ip:…» o «entrar:correo:<huella>»: el correo no se guarda en claro.
CREATE TABLE IF NOT EXISTS intentos (
  clave CHAR(80) NOT NULL PRIMARY KEY,
  contador INT UNSIGNED NOT NULL DEFAULT 0,
  ventana_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4;
