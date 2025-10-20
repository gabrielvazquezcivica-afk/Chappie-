# Chappie Bot 🤖

Bot de WhatsApp multi-función usando Baileys

## Instalación

```sh
git clone https://github.com/gabrielvazquezcivica-afk/Chappie-.git
cd Chappie-
npm install
```

## Uso

- Ejecuta el bot:
  ```sh
  npm start
  ```
- Escanea el QR que aparece en la terminal para iniciar sesión.

## Comandos básicos

- `!ping` / `/ping` — responde Pong 🏓
- `!echo <texto>` / `/echo <texto>` — repite el texto que envíes
- `!help` / `/help` — muestra ayuda sobre comandos disponibles

## Estructura

- `index.js` — gestor principal y recargador automático
- `main.js` — lógica del bot y conexión con WhatsApp
- `almacenamiento/` — comandos y funciones adicionales
- `config.js` — configuración de parámetros y mensajes
- `package.json` — dependencias y metadatos

## Requisitos

- Node.js 18+ recomendado
- Termux/Ubuntu/Windows compatible

## Dependencias principales

- [@adiwajshing/baileys](https://github.com/adiwajshing/Baileys) — conexión WhatsApp
- `pino` — logs bonitos
- `cfonts` — fuentes en consola
- Otros: axios, cheerio, chalk, file-type, moment-timezone, node-fetch, qrcode-terminal

## Notas

- El bot guarda la sesión en `session.json`.
- Si la sesión se cierra por logout, deberás escanear el QR nuevamente.
- Puedes crear tus propios comandos en la carpeta `almacenamiento/`.

## Créditos

Desarrollado por [Gabo](https://github.com/gabrielvazquezcivica-afk) y Chappie Team.
