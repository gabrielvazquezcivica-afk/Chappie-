/**
 * main.js
 * Bot de WhatsApp con @adiwajshing/baileys
 * Añadido: stickers, respuesta a imágenes, manejo de comandos en grupos (info, kick de ejemplo)
 *
 * Requisitos:
 *  - Node.js >= 16
 *  - npm i @adiwajshing/baileys@latest sharp
 *
 * Uso:
 *  - node main.js
 *  - Escanea el QR la primera vez. La sesión se guarda en auth_info.json.
 *
 * Notas:
 *  - La creación de stickers usa sharp para convertir la imagen a webp.
 *  - El comando de kick es un ejemplo que requiere permisos de administrador en el grupo
 *    y que el bot también sea admin del grupo.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');

const {
  default: makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadContentFromMessage
} = require('@adiwajshing/baileys');

const AUTH_FILE = path.resolve('./auth_info.json');
const TMP_DIR = path.resolve('./tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// useSingleFileAuthState crea/usa un archivo con la sesión (credenciales)
const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

async function bufferFromStream(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

// Convierte un buffer de imagen a webp optimizado para sticker (512 max)
async function imageToWebp(buffer, outPath) {
  // Ajusta tamaño manteniendo relación, máximo 512
  await sharp(buffer)
    .resize(512, 512, { fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(outPath);
  return outPath;
}

async function startBot() {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log('Conectando con Baileys WA version:', version, 'isLatest:', isLatest);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: undefined
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) console.log('Nuevo QR generado. Escanea con tu WhatsApp.');
      if (connection === 'open') {
        console.log('Conectado a WhatsApp!');
      } else if (connection === 'close') {
        console.log('Conexión cerrada:', lastDisconnect?.error || lastDisconnect);
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Sesión cerrada. Borrando credenciales...');
          try { fs.unlinkSync(AUTH_FILE); } catch (e) { /* ignore */ }
        }
        setTimeout(() => startBot(), 2000);
      }
    });

    // Helper: enviar texto
    const sendText = async (jid, body, quoted = null) => {
      await sock.sendMessage(jid, { text: body }, { quoted });
    };

    // Helper: obtener texto desde distintos tipos de mensaje
    const extractText = (msg) => {
      if (!msg.message) return '';
      const type = Object.keys(msg.message)[0];
      if (type === 'conversation') return msg.message.conversation || '';
      if (type === 'extendedTextMessage') return msg.message.extendedTextMessage?.text || '';
      if (type === 'imageMessage') return msg.message.imageMessage?.caption || '';
      if (type === 'videoMessage') return msg.message.videoMessage?.caption || '';
      return '';
    };

    // Helper: obtener un mensaje citado si existe
    const getQuoted = (msg) => {
      try {
        return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? msg.message.extendedTextMessage.contextInfo : null;
      } catch {
        return null;
      }
    };

    // Manejo de mensajes
    sock.ev.on('messages.upsert', async (m) => {
      try {
        if (!m || !m.messages) return;
        const msg = m.messages[0];
        if (!msg.message) return;
        if (msg.key && msg.key.remoteJid === 'status@broadcast') return; // ignorar estados

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        const text = extractText(msg);
        const trimmed = text.trim();
        const prefix = (trimmed.startsWith('!') || trimmed.startsWith('/')) ? trimmed[0] : null;

        // RESPUESTA AUTOMÁTICA A IMÁGENES (cuando NO es comando)
        const msgType = Object.keys(msg.message)[0];
        if (!prefix && (msgType === 'imageMessage' || msgType === 'videoMessage')) {
          // Responder agradeciendo y mostrando que se recibió la imagen
          await sendText(from, 'Imagen recibida ✅', msg);
          return;
        }

        if (!prefix) return;

        const args = trimmed.slice(1).trim().split(/\s+/).filter(a => !!a);
        const command = (args.shift() || '').toLowerCase();

        console.log(`Comando: ${command} from ${sender} (group: ${isGroup})`);

        // COMMAND: help
        if (command === 'help') {
          const helpMsg = [
            'Comandos disponibles:',
            '!ping - Comprueba si el bot responde',
            '!help - Muestra esta ayuda',
            '!echo <texto> - Repite el texto',
            '!sticker - Convierte la imagen (enviado o citado) a sticker',
            '!groupinfo - Muestra información del grupo (solo en grupos)',
            '!kick @user - Expulsa a la persona (solo admins de grupo)',
          ].join('\n');
          await sendText(from, helpMsg, msg);
          return;
        }

        // COMMAND: ping
        if (command === 'ping') {
          const start = Date.now();
          await sendText(from, 'Pong! ⏱️', msg);
          const latency = Date.now() - start;
          await sendText(from, `Latencia aproximada: ${latency}ms`, msg);
          return;
        }

        // COMMAND: echo
        if (command === 'echo') {
          const reply = args.join(' ');
          if (!reply) await sendText(from, 'Uso: !echo <texto>', msg);
          else await sendText(from, reply, msg);
          return;
        }

        // COMMAND: sticker -> convierte imagen enviada o imagen citada a sticker
        if (command === 'sticker' || command === 'stiker') {
          // Determinar si el mensaje actual contiene una imagen/video o cita una imagen/video
          let mediaMsg = null;
          // imagen/video directo
          if (msgType === 'imageMessage' || msgType === 'videoMessage') {
            mediaMsg = msg.message[msgType];
          } else {
            // buscar mensaje citado
            const ctx = getQuoted(msg);
            if (ctx && ctx.quotedMessage) {
              const quotedMsg = ctx.quotedMessage;
              const qType = Object.keys(quotedMsg)[0];
              if (qType === 'imageMessage' || qType === 'videoMessage') {
                mediaMsg = quotedMsg[qType];
              }
            }
          }

          if (!mediaMsg) {
            await sendText(from, 'No veo ninguna imagen o video para convertir. Envía o cita una imagen y usa !sticker', msg);
            return;
          }

          // Descargar media
          try {
            const mimeType = mediaMsg.mimetype || '';
            const type = mimeType.startsWith('image') ? 'image' : 'video';
            const stream = await downloadContentFromMessage(mediaMsg, type);
            const buffer = await bufferFromStream(stream);

            // Guardar temporalmente y convertir a webp con sharp
            const tmpInput = path.join(TMP_DIR, `input_${Date.now()}`);
            const tmpWebp = path.join(TMP_DIR, `sticker_${Date.now()}.webp`);
            fs.writeFileSync(tmpInput, buffer);

            await imageToWebp(buffer, tmpWebp);

            // Enviar sticker
            const stickerBuffer = fs.readFileSync(tmpWebp);
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

            // limpiar
            try { fs.unlinkSync(tmpInput); } catch {}
            try { fs.unlinkSync(tmpWebp); } catch {}
          } catch (e) {
            console.error('Error creando sticker:', e);
            await sendText(from, 'Error al crear el sticker. Asegúrate de enviar una imagen válida.', msg);
          }
          return;
        }

        // COMMANDS PARA GRUPOS
        if (isGroup) {
          // Obtener metadata del grupo
          let metadata = null;
          try {
            metadata = await sock.groupMetadata(from);
          } catch (e) {
            // si falla, no bloqueamos todo
            console.warn('No se pudo obtener metadata del grupo:', e);
          }

          // helper para saber si un participante es admin
          const isAdmin = (jidToCheck) => {
            if (!metadata || !metadata.participants) return false;
            const p = metadata.participants.find(p => p.id === jidToCheck);
            return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'));
          };

          // !groupinfo
          if (command === 'groupinfo') {
            if (!metadata) {
              await sendText(from, 'No puedo obtener información del grupo en este momento.', msg);
              return;
            }
            const groupName = metadata.subject || '—';
            const groupDesc = metadata.desc || 'Sin descripción';
            const participants = metadata.participants?.length || 0;
            const admins = metadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
            const reply = [
              `Nombre: ${groupName}`,
              `Descripción: ${groupDesc}`,
              `Miembros: ${participants}`,
              `Admins: ${admins.join(', ') || 'Ninguno'}`,
            ].join('\n');
            await sendText(from, reply, msg);
            return;
          }

          // !kick @user -> expulsar usuario (ejemplo)
          if (command === 'kick') {
            // verifica permisos: quien manda debe ser admin y el bot también
            const botId = (sock.user && (sock.user.id || sock.user?.jid)) ? (sock.user.id || sock.user?.jid) : null;
            if (!isAdmin(sender)) {
              await sendText(from, 'Solo administradores del grupo pueden usar este comando.', msg);
              return;
            }
            if (!isAdmin(botId)) {
              await sendText(from, 'Necesito ser administrador del grupo para expulsar usuarios.', msg);
              return;
            }

            // obtener menciones desde la metadata del contexto (extendedTextMessage.contextInfo.mentionedJid)
            const ctx = getQuoted(msg);
            const mentioned = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) || [];
            // alternativamente si no hay menciones, el primer arg puede ser @waid
            if (mentioned.length === 0) {
              await sendText(from, 'Usa: !kick @usuario (menciona al usuario a expulsar).', msg);
              return;
            }

            try {
              // expulsar cada mencionado
              for (const target of mentioned) {
                await sock.groupParticipantsUpdate(from, [target], 'remove');
              }
              await sendText(from, `Usuarios expulsados: ${mentioned.join(', ')}`, msg);
            } catch (e) {
              console.error('Error al expulsar:', e);
              await sendText(from, 'No pude expulsar al/los usuario(s). Asegúrate de que tengo permisos y que el usuario no sea admin.', msg);
            }
            return;
          }
        } // fin isGroup

        // Si no coincide ningún comando
        await sendText(from, `Comando no reconocido: ${command}\nUsa !help para ver los comandos.`, msg);
      } catch (err) {
        console.error('Error manejando mensaje:', err);
      }
    }); // fin messages.upsert

    sock.ev.on('error', (err) => {
      console.error('Socket error:', err);
    });

    return sock;
  } catch (e) {
    console.error('Error iniciando bot:', e);
    setTimeout(() => startBot(), 2500);
  }
}

// Iniciar
startBot();
