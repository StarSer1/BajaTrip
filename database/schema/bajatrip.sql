-- Base de datos que comparten los nodos del backend (Práctica 5).
-- El servidor ejecuta este archivo al arrancar: IF NOT EXISTS permite que los dos nodos lo intenten a la vez.

-- Una sesión por visitante. El navegador guarda un token al azar en una cookie HttpOnly y aquí
-- solo queda su huella SHA-256: con una copia de esta tabla no se puede suplantar a nadie.
CREATE TABLE IF NOT EXISTS sesiones (
  id CHAR(64) NOT NULL PRIMARY KEY,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nodo_origen VARCHAR(40) NOT NULL
) DEFAULT CHARSET = utf8mb4;

-- Reservas de ejemplo. El id lo genera el navegador al guardarlas en IndexedDB: si un reintento
-- llega dos veces, a cualquiera de los nodos, la reserva no se duplica.
CREATE TABLE IF NOT EXISTS reservas (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sesion_id CHAR(64) NOT NULL,
  experiencia_id VARCHAR(40) NOT NULL,
  fecha DATE NOT NULL,
  viajeros TINYINT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  nodo VARCHAR(40) NOT NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX reservas_por_sesion (sesion_id),
  CONSTRAINT reservas_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones (id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4;
