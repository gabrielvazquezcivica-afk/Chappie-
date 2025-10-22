// almacenamiento/sticker.js
// Comando para crear stickers a partir de imágenes o videos enviados en WhatsApp.
// Requiere ffmpeg instalado en el sistema (para conversión a WebP).
// Uso: Envía una imagen o video con el comando !sticker o /sticker.

const { downloadMediaMessage } = require('@adiwajshing/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'sticker',
  description: 'Convierte una imagen o video en un sticker de WhatsApp',
  aliases: ['s'], // Opcional: alias para !s
  async execute(sock, msg, args) {
    const message = msg.message;
    let mediaMessage = null;

    // Verificar si hay imagen o video en el mensaje
    if (message.imageMessage) {
      mediaMessage = message.imageMessage;
    } else if (message.videoMessage) {
      mediaMessage = message.videoMessage;
    } else if (message.extendedTextMessage && message.extendedTextMessage.contextInfo && message.extendedTextMessage.contextInfo.quotedMessage) {
      // Si es una respuesta a un mensaje con media
      const quoted = message.extendedTextMessage.contextInfo.quotedMessage;
      if (quoted.imageMessage) {
        mediaMessage = quoted.imageMessage;
      } else if (quoted.videoMessage) {
        mediaMessage = quoted.videoMessage;
      }
    }

    if (!mediaMessage) {
      return sock.sendMessage(msg.key.remoteJid, { text: 'Envía una imagen o video con el comando !sticker o responde a uno con !sticker' });
    }

    try {
      // Descargar el media
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger });

      // Rutas temporales
      const inputPath = path.join(__dirname, `temp_input_${Date.now()}.${mediaMessage.mimetype.split('/')[1]}`);
      const outputPath = path.join(__dirname, `temp_output_${Date.now()}.webp`);

      // Guardar el archivo temporal
      fs.writeFileSync(inputPath, buffer);

      // Comando ffmpeg para convertir a sticker (512x512, WebP, con padding si es necesario)
      const ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libwebp -quality 80 -loop 0 "${outputPath}"`;

      exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Error en ffmpeg:', error);
          sock.sendMessage(msg.key.remoteJid, { text: 'Error al crear el sticker. Asegúrate de que ffmpeg esté instalado.' });
          return;
        }

        // Leer el archivo WebP generado
        const stickerBuffer = fs.readFileSync(outputPath);

        // Enviar el sticker
        sock.sendMessage(msg.key.remoteJid, { sticker: stickerBuffer }, { quoted: msg });

        // Limpiar archivos temporales
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    } catch (error) {
      console.error('Error al procesar el sticker:', error);
      sock.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al procesar el sticker.' });
    }
  }
};
