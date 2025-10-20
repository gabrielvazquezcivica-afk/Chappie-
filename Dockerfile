# Imagen base
FROM node:18-bullseye-slim

# Evitar que Puppeteer trate de descargar Chromium (usaremos el paquetizado del sistema)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Instalar dependencias del sistema y Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxcb1 \
    libxss1 \
    libnss3 \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Algunos paquetes crean el binario chromium-browser; dejamos un enlace por si acaso
RUN (command -v chromium-browser >/dev/null 2>&1 && ln -sf "$(command -v chromium-browser)" /usr/bin/chromium) || true

# Directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y lock para instalar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del proyecto
COPY . .

# Persistencia del directorio de sesión recomendada mediante volumen externo al ejecutar
# Comando por defecto
CMD ["node", "index.js"]
