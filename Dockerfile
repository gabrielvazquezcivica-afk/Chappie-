# Usa una imagen base oficial de Node.js
FROM node:16

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias al directorio de trabajo
COPY package*.json ./

# Instala las dependencias (usa npm ci si tienes package-lock.json)
RUN npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto en el que correrá el bot (ajusta si usas otro)
EXPOSE 3000

# Comando para ejecutar el bot
CMD [ "npm", "start" ]
