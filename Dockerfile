# Imagen de un nodo de BajaTrip: la API de backend/ y el sitio compilado en dist/.
# El sitio se compila antes, fuera del contenedor: npm run build
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
# Solo dependencias de producción y sin scripts de instalación de terceros.
RUN npm ci --omit=dev --ignore-scripts
COPY backend ./backend
COPY database/schema ./database/schema
COPY frontend/src/data/experiences.js ./frontend/src/data/experiences.js
COPY dist ./dist
# Carpeta de las fotos subidas, fuera de dist/. El volumen «subidas» toma este dueño al crearse.
RUN mkdir -p /app/subidas && chown node:node /app/subidas
# Sin privilegios de root: si alguien lograra ejecutar algo en el nodo, no sería administrador.
USER node
EXPOSE 3000
CMD ["node", "backend/server.js"]
