# Balanceo de carga: elección de algoritmos

Actividad de la sesión 15 (Unidad 3). Para cada caso elegimos un algoritmo, explicamos por qué y qué pasaría si dejáramos el turno rotatorio que Nginx usa por defecto.

## Casos A a D

| Caso | Algoritmo | Por qué | Qué pasaría con turno rotatorio |
| --- | --- | --- | --- |
| **A · Catálogo público** | Turno rotatorio | Las consultas son cortas y parecidas y los tres servidores son iguales: repartir 1, 2, 3 ya queda parejo sin medir nada. | Es el elegido. Funciona bien porque ninguna petición tarda mucho más que otra. |
| **B · Reportes de ventas** | Menos conexiones (`least_conn`) | Un reporte de 30 s mantiene su conexión abierta; el balanceador ve ese servidor ocupado y manda los cobros de 100 ms a los demás. | A un servidor le pueden tocar dos o tres reportes seguidos; los cobros que caen ahí esperan detrás de ellos mientras los otros servidores están libres. |
| **C · Máquinas desiguales** | Turno rotatorio ponderado (`weight=2` en los nuevos, `weight=1` en el viejo) | El viejo tiene la mitad de memoria, así que recibe la mitad que cada nuevo: 2 de cada 5 peticiones a cada nuevo y 1 de cada 5 al viejo. | Los tres reciben un tercio. El viejo se satura primero y empieza a responder lento o con errores mientras los nuevos tienen capacidad sobrante. |
| **D · Pantalla de cocina** | Menos conexiones (`least_conn`) | Cada WebSocket queda abierto todo el turno; contar conexiones abiertas es contar la carga real. Además hay que pasar `Upgrade` y `Connection`, y publicar las comandas en un canal compartido (Redis) para que lleguen a pantallas conectadas a otro servidor. | Reparte bien las conexiones nuevas, pero no ve las que siguen abiertas. Si un servidor se reinicia, sus pantallas se reconectan repartidas entre todos y el servidor que volvió queda casi vacío mientras los otros cargan con todo. |

## Caso E · BajaTrip

### Perfiles de tráfico

El frontend (React compilado en `dist/`) ya se sirve desde Cloudflare como archivos estáticos, así que no pasa por nuestro balanceador. Lo que se balancea es el backend que vamos a construir en `backend/modules/`.

| Perfil | Módulos | Cómo es el tráfico | Algoritmo |
| --- | --- | --- | --- |
| API general | `servicios`, `categorias`, `municipios`, `disponibilidad`, `reservas`, `auth`, `resenas`, `sincronizacion` | Muchas peticiones cortas y parecidas: buscar por municipio, consultar disponibilidad, reservar, iniciar sesión. | Turno rotatorio |
| Peticiones largas | `archivos` (fotos de los prestadores), `estadisticas` (gráficos del administrador) | Pocas, pero tardan: subir varias fotos o agrupar reservas por municipio y mes. | Menos conexiones |
| Tiempo real | `notificaciones` | El prestador deja su panel abierto horas con un WebSocket para recibir las reservas nuevas al instante. | Menos conexiones |

Separamos los tres perfiles en grupos (`upstream`) distintos para que una subida de fotos o un reporte no frene a quien solo está buscando un tour.

### Cómo resolvemos la sesión: almacén compartido

Guardamos la sesión en la base de datos del proyecto. El navegador solo lleva una cookie `HttpOnly` con un identificador al azar, y cualquier servidor la busca en la misma tabla. Si el backend termina en Laravel es `SESSION_DRIVER=database`; en Node, un almacén de sesiones sobre la misma base.

- **Descartamos la afinidad por IP.** Los turistas se conectan desde el wifi de un hotel, de un aeropuerto o de un tour, y todos salen por la misma IP: caerían en un solo servidor. Además, si ese servidor se cae, pierden la sesión a mitad de una reserva.
- **Descartamos el testigo firmado (JWT).** El administrador aprueba y bloquea prestadores y modera contenido. Un prestador bloqueado debe perder el acceso en ese momento, no cuando caduque su token, y con un testigo firmado eso es difícil.
- **Las notificaciones usan un canal compartido.** La reserva del turista puede llegar al servidor 1 mientras el prestador está conectado al 2. El servidor que guarda la reserva la publica en Redis y cada servidor se la entrega a los prestadores que tiene conectados.
- **Las fotos tampoco se guardan en el disco de un servidor.** Si se suben al servidor 1, el 2 no las tiene. Van a un almacenamiento compartido (por ejemplo R2 de Cloudflare) y la base guarda solo la dirección.
- **La sincronización no debe duplicar reservas.** Cuando el turista recupera señal, la app reenvía las reservas guardadas en IndexedDB, y un reintento puede caer en otro servidor. Cada reserva lleva el identificador que se creó en el navegador; si ya existe en la base, el servidor la ignora en lugar de crear otra.

### Salud y cabeceras

- **`/salud`** responde 200 solo si la base de datos y Redis contestan. Un servidor que no llega a la base no puede guardar reservas, aunque su proceso siga vivo.
- **Cabeceras.** El balanceador pasa `Host`, `X-Forwarded-For` y `X-Forwarded-Proto`, y el backend solo las acepta si vienen de la IP del balanceador. Sin `X-Forwarded-Proto`, la app creería que el turista entró por http y armaría mal los enlaces de confirmación.

### Boceto para la Práctica 5

Las IP son de ejemplo. Lo ajustaremos con las tres máquinas del equipo.

```nginx
upstream api {
    server 192.168.1.11:3000 max_fails=2 fail_timeout=10s;
    server 192.168.1.12:3000 max_fails=2 fail_timeout=10s;
    server 192.168.1.13:3000 max_fails=2 fail_timeout=10s;
}

upstream api_lenta {
    least_conn;
    server 192.168.1.11:3000 max_fails=2 fail_timeout=10s;
    server 192.168.1.12:3000 max_fails=2 fail_timeout=10s;
    server 192.168.1.13:3000 max_fails=2 fail_timeout=10s;
}

upstream tiempo_real {
    least_conn;
    server 192.168.1.11:3001 max_fails=2 fail_timeout=10s;
    server 192.168.1.12:3001 max_fails=2 fail_timeout=10s;
    server 192.168.1.13:3001 max_fails=2 fail_timeout=10s;
}

server {
    listen 80;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location /api/ {
        proxy_pass http://api;
    }

    location ~ ^/api/(archivos|estadisticas)/ {
        client_max_body_size 20m;
        proxy_pass http://api_lenta;
    }

    location /tiempo-real/ {
        proxy_pass http://tiempo_real;
        proxy_http_version 1.1;
        # Un proxy_set_header aquí anula los del bloque server: se repiten.
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 1h;
    }
}
```

