# Chappie

<div align="center">
  <img src="https://i.imgur.com/ChappieBotLogo.png" width="200" alt="Chappie Logo"/>
  <h2>🤖 Chappie - Bot de WhatsApp Multi-función</h2>
</div>

Chappie es un bot de WhatsApp multipropósito basado en [Baileys](https://github.com/adiwajshing/Baileys), capaz de ejecutar comandos, responder a mensajes, descargar multimedia, y mucho más. Fácil de instalar y personalizar para tus necesidades.

---

## 🛠️ Instalación

### Requisitos

- Node.js (recomendado v18 o superior)
- Git
- Una cuenta de WhatsApp activa
- [FFmpeg](https://ffmpeg.org/) (para funciones de audio/video)

### Pasos para la instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/gabrielvazquezcivica-afk/Chappie-.git
   cd Chappie-
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura el entorno:**
   - Renombra el archivo `.env.example` a `.env` y coloca tus datos.

4. **Inicia el bot:**
   ```bash
   npm start
   ```
   O usando PM2:
   ```bash
   pm2 start index.js
   ```

---

## 🧩 Características Principales

- Respuesta automática a mensajes
- Descarga de videos y música
- Comandos de administración de grupos
- Stickers personalizados
- Generación de memes
- ¡Y mucho más!

---

## ⚙️ Comandos Básicos

- `!menu` - Muestra el menú de comandos disponibles
- `!sticker` - Convierte una imagen o video en sticker
- `!play <nombre>` - Descarga música de YouTube
- `!ytmp4 <enlace>` - Descarga videos de YouTube
- `!grupo abrir/cerrar` - Administra la configuración del grupo

> **Nota:** Escribe `!menu` para ver la lista completa de comandos.

---

## 📦 Créditos

Este bot está basado en el desarrollo de [adiwajshing/Baileys](https://github.com/adiwajshing/Baileys) y otros proyectos de la comunidad de WhatsApp bots.

---

## 📝 Licencia

Este proyecto se distribuye bajo la Licencia MIT.

---

## 💬 Contacto y Soporte

¿Tienes dudas, sugerencias o encontraste un bug?  
Crea un [Issue](https://github.com/gabrielvazquezcivica-afk/Chappie-/issues) o contacta al autor.

---

<div align="center">
  <b>¡Gracias por usar Chappie!</b>
</div>
