#!/usr/bin/env bash
# Certificado HTTPS para probar BajaTrip en este equipo (y en la red del salón).
# Hace lo mismo que mkcert: crea una autoridad certificadora (CA) propia y con ella firma el
# certificado del sitio. Si Windows confía en esa CA, el navegador muestra el candado sin aviso.
#
# Uso (Git Bash, desde la raíz del repositorio):
#   bash scripts/certificado-local.sh               # localhost y 127.0.0.1
#   bash scripts/certificado-local.sh 192.168.1.50  # además, la IP de este equipo en la red
#
# Después, una sola vez, confía en la CA (PowerShell como usuario normal):
#   certutil -user -addstore Root nginx\certs\bajatrip-ca.crt
#
# Los archivos quedan en nginx/certs/, que está en .gitignore: la llave privada nunca se sube.
# En un servidor con dominio no se usa esto: se usa Let's Encrypt (README, perfil «publico»).
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=nginx/certs
mkdir -p "$DIR"
export MSYS_NO_PATHCONV=1   # Git Bash: que no convierta «/CN=…» en una ruta de Windows

# 1. La CA: se crea solo la primera vez, así no hay que volver a importarla.
if [ ! -f "$DIR/bajatrip-ca.key" ]; then
  openssl req -x509 -new -newkey rsa:3072 -nodes -sha256 -days 825 \
    -keyout "$DIR/bajatrip-ca.key" -out "$DIR/bajatrip-ca.crt" \
    -subj "/O=BajaTrip (desarrollo)/CN=BajaTrip CA local" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
    -addext "keyUsage=critical,keyCertSign,cRLSign"
fi

# 2. El certificado del sitio: los nombres por los que se va a entrar (SAN).
SAN="DNS:localhost,IP:127.0.0.1"
for ip in "$@"; do SAN="$SAN,IP:$ip"; done
openssl req -new -newkey rsa:2048 -nodes -sha256 \
  -keyout "$DIR/bajatrip.key" -out "$DIR/bajatrip.csr" -subj "/CN=localhost"
# 397 días: el máximo que aceptan los navegadores para un certificado de sitio.
printf 'subjectAltName=%s\nbasicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n' "$SAN" > "$DIR/extensiones.cnf"
openssl x509 -req -in "$DIR/bajatrip.csr" -CA "$DIR/bajatrip-ca.crt" -CAkey "$DIR/bajatrip-ca.key" \
  -CAcreateserial -days 397 -sha256 -out "$DIR/bajatrip.crt" -extfile "$DIR/extensiones.cnf"
# Nginx debe mandar el certificado del sitio y, detrás, el de la CA (la cadena completa).
cat "$DIR/bajatrip-ca.crt" >> "$DIR/bajatrip.crt"
rm -f "$DIR/bajatrip.csr" "$DIR/extensiones.cnf"

echo "Listo: $DIR/bajatrip.crt para $SAN"
echo "Si es la primera vez, confía en la CA: certutil -user -addstore Root nginx\certs\bajatrip-ca.crt"
echo "Si el balanceador ya estaba corriendo: docker compose restart balanceador"
