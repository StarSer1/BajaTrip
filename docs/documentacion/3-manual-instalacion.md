# 3. Manual de instalación

Con este manual, alguien que no conoce el proyecto puede levantar BajaTrip completo en su computadora: el balanceador con HTTPS, dos nodos y MySQL. Los comandos están escritos para **Windows 10/11 con PowerShell**, salvo donde se indica **Git Bash**. Al final hay una sección para macOS y Linux.

Tiempo aproximado: 20 minutos la primera vez (la mayor parte es descargar imágenes de Docker).

## 1. Requisitos

| Programa | Versión | Para qué | Cómo comprobarlo |
| --- | --- | --- | --- |
| Git para Windows (incluye **Git Bash** y OpenSSL) | 2.40 o posterior | Descargar el código y crear el certificado | `git --version` |
| Node.js | **22.12 o posterior** (LTS) | Compilar el sitio | `node --version` |
| Docker Desktop (con WSL 2) | 4.30 o posterior | Correr el balanceador, los nodos y MySQL | `docker --version` y `docker compose version` |

También se necesita:
- Conexión a internet durante la instalación (paquetes de npm e imágenes de Docker) y para el captcha del registro.
- Unos 5 GB libres en disco.
- Los puertos **8080, 8443, 8001 y 8002** libres. Para revisarlo: `Get-NetTCPConnection -LocalPort 8080,8443,8001,8002 -ErrorAction SilentlyContinue` no debe mostrar nada.

Descargas: Git en https://git-scm.com/download/win, Node.js en https://nodejs.org/ (versión LTS) y Docker Desktop en https://www.docker.com/products/docker-desktop/. Instálalos con las opciones predeterminadas. Después de instalar Docker Desktop, **ábrelo y espera a que diga «Engine running»**; la primera vez puede pedir reiniciar Windows.

## 2. Descargar el código

En PowerShell, dentro de la carpeta donde quieras el proyecto:

```powershell
git clone https://github.com/StarSer1/BajaTrip.git
cd BajaTrip
```

Todos los comandos siguientes se ejecutan **dentro de la carpeta `BajaTrip`**.

## 3. Instalar dependencias

```powershell
npm ci
```

Instala exactamente las versiones de `package-lock.json`. Pueden aparecer avisos (`npm warn`); no son errores. Debe terminar con `added … packages`.

## 4. Crear el archivo de configuración `.env`

```powershell
Copy-Item .env.example .env
notepad .env
```

En el Bloc de notas cambia los valores de `DB_PASSWORD` y `DB_ROOT_PASSWORD` por dos contraseñas tuyas. Usa letras, números y guiones; **evita `$`, `#`, comillas y espacios**, porque Docker Compose los interpreta. Guarda y cierra. El resto de los valores puede quedarse igual:

| Variable | Valor por defecto | Para qué |
| --- | --- | --- |
| `TURNSTILE_SITEKEY` / `TURNSTILE_SECRET` | Llaves de **prueba** de Cloudflare | El captcha siempre pasa. Para producción se crean llaves reales en el panel de Cloudflare › Turnstile |
| `DOMINIO` | `localhost` | Nombre del sitio |
| `HTTPS_PUERTO` | `8443` | Puerto HTTPS en tu equipo |
| `HSTS_MAX_AGE` | `300` | Segundos de HSTS (corto en local) |

`.env` nunca se sube a Git: está en `.gitignore`.

## 5. Compilar el sitio

```powershell
npm run build
```

Crea la carpeta `dist/` con el sitio compilado. Debe terminar con `✓ built in …`. **Importante:** la imagen de Docker copia `dist/`. Si después cambias el frontend, vuelve a ejecutar `npm run build` y luego `docker compose up -d --build`.

## 6. Crear el certificado HTTPS local

Abre **Git Bash** (menú Inicio › Git Bash), entra a la carpeta del proyecto y ejecuta el script. Ejemplo si clonaste en Documentos:

```bash
cd ~/Documents/BajaTrip
bash scripts/certificado-local.sh
```

Debe terminar con `Listo: nginx/certs/bajatrip.crt para DNS:localhost,IP:127.0.0.1`. El script crea una autoridad certificadora (CA) propia y con ella firma el certificado del sitio. Todo queda en `nginx/certs/`, que no se sube a Git.

Desde PowerShell también funciona así (si Git está en la ruta predeterminada):

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/certificado-local.sh
```

> No uses `bash` a secas en PowerShell: si tienes WSL instalado, abre la bash de Linux en lugar de la de Git.

**Para que el navegador confíe en el certificado** (una sola vez por computadora), en PowerShell:

```powershell
certutil -user -addstore Root nginx\certs\bajatrip-ca.crt
```

Windows muestra un aviso de seguridad: elige **Sí**. Chrome y Edge usan este almacén. Firefox tiene el suyo: en Configuración › Privacidad › Certificados › Ver certificados › Autoridades › Importar, elige el mismo archivo. Si te saltas este paso, el sitio funciona igual, pero el navegador muestra «La conexión no es privada» y hay que aceptar el riesgo.

Para entrar desde **otro dispositivo de la red** (un celular, por ejemplo), genera el certificado con la IP de tu equipo (`ipconfig` › Dirección IPv4), por ejemplo `bash scripts/certificado-local.sh 192.168.1.50`, y entra a `https://192.168.1.50:8443`.

## 7. Levantar el sistema

Con Docker Desktop abierto:

```powershell
docker compose up -d --build
```

La primera vez descarga `nginx`, `node` y `mysql` y construye la imagen de los nodos. Comprueba que los cuatro contenedores estén arriba:

```powershell
docker compose ps
```

Debes ver `bajatrip-balanceador-1`, `bajatrip-app1-1` y `bajatrip-app2-1` con estado `Up`, y `bajatrip-db-1` con `Up (healthy)`. MySQL tarda de 10 a 30 segundos en quedar listo la primera vez. En la bitácora de los nodos debe aparecer `base-lista`:

```powershell
docker compose logs app1 app2
```

## 8. Comprobar que funciona

1. Abre **https://localhost:8443**: aparece la página de inicio de BajaTrip, con el candado.
2. Abre **http://localhost:8080**: debe llevarte solo a `https://localhost:8443`.
3. En PowerShell:
   ```powershell
   curl.exe -sk https://localhost:8443/salud
   ```
   Responde `{"nodo":"1","bd":"ok",…}` (o `"nodo":"2"`). Repítelo: el nodo va cambiando.
4. Entra a **Entrar › Crea una**, registra una cuenta e inicia sesión.

### Pruebas automáticas (opcional)

```powershell
npx playwright install chromium
npm test                 # frontend (levanta su propio servidor de desarrollo)
npm run test:seguridad   # las 14 medidas de seguridad, contra los contenedores
```

`npm run test:seguridad` necesita los contenedores arriba y el archivo `.env` (lee la contraseña para consultar la base). Debe terminar con `15 passed`.

## 9. Tareas comunes

| Quiero… | Comando |
| --- | --- |
| Detener todo (conserva los datos) | `docker compose down` |
| Volver a encenderlo | `docker compose up -d` |
| Borrar también la base y las fotos | `docker compose down -v` |
| Ver la bitácora en vivo | `docker compose logs -f app1 app2` |
| Hacer administradora una cuenta | `docker compose exec app1 node backend/scripts/admin.js correo@ejemplo.com` |
| Reiniciar el límite de intentos | `docker compose exec db mysql -ubajatrip -p bajatrip -e "DELETE FROM intentos"` (pide la contraseña `DB_PASSWORD`) |
| Probar el segundo algoritmo de balanceo | Quitar el `#` de `least_conn;` en `nginx/templates/default.conf.template` y `docker compose restart balanceador` |
| Solo el frontend, sin Docker | `npm run dev` y abrir `http://localhost:5173` (sin cuentas ni reservas en el servidor) |

## 10. Si algo falla

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `failed to connect to the docker API` o `error during connect` | Docker Desktop no está abierto | Ábrelo, espera «Engine running» y repite |
| `required variable DB_PASSWORD is missing` | Falta `.env` | Paso 4 |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | Otro programa usa el puerto | Ciérralo, o en `.env` agrega `HTTP_PUERTO=8081` y `HTTPS_PUERTO=8444` y entra por esos puertos |
| `bajatrip-balanceador-1` se reinicia una y otra vez; en `docker compose logs balanceador` aparece `cannot load certificate` | No existe el certificado | Paso 6, luego `docker compose restart balanceador` |
| `$'\r': command not found` al correr el script | El script se descargó con saltos de línea de Windows | `git config core.autocrlf input`, borra `scripts/certificado-local.sh`, ejecuta `git checkout -- scripts/certificado-local.sh` y repite |
| La página dice `Falta compilar el sitio: npm run build.` | La imagen se construyó sin `dist/` | `npm run build` y `docker compose up -d --build` |
| `/salud` responde `"bd":"caida"` o el registro falla con 503 | MySQL todavía arranca, o la contraseña de `.env` cambió después de crear la base | Espera 30 s. Si cambiaste la contraseña: `docker compose down -v` y `docker compose up -d` (borra los datos) |
| «La conexión no es privada» | El navegador no confía en la CA local | Importa la CA (paso 6) y cierra y abre el navegador |
| El captcha del registro no aparece | No hay internet o una extensión bloquea `challenges.cloudflare.com` | Revisa la conexión o desactiva el bloqueador para `localhost` |
| `Demasiados intentos. Espera…` | Funciona el límite de intentos | Espera 15 minutos o reinicia el límite (tabla de la sección 9) |

## 11. macOS y Linux

Los pasos son los mismos con estos cambios: `cp .env.example .env` en lugar de `Copy-Item`; el script del certificado se ejecuta en la terminal normal (`bash scripts/certificado-local.sh`, necesita `openssl`); y para confiar en la CA:
- macOS: `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain nginx/certs/bajatrip-ca.crt`
- Ubuntu/Debian: `sudo cp nginx/certs/bajatrip-ca.crt /usr/local/share/ca-certificates/bajatrip-ca.crt && sudo update-ca-certificates`. Chrome en Linux usa su propio almacén: Configuración › Privacidad › Gestionar certificados › Autoridades › Importar.

## 12. Publicar con dominio propio (Let's Encrypt)

En un servidor con dominio propio y los puertos 80 y 443 abiertos, el procedimiento está en el [README](../../README.md#con-dominio-propio-lets-encrypt) y se explica en la [Tarea 4](../tarea-4/tarea-4-firma-certificados-https.pdf). La versión estática pública se publica en Cloudflare con `npx wrangler login` (una vez) y `npm run deploy`.
