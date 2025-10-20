import pino from 'pino';
import {
  default as makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeInMemoryStore
} from '@adiwajshing/baileys';
import fs from 'fs';
import path from 'path';

const logger = pino({ level: 'info' });

// Archivo donde se guardará la sesión (credenciales)
const SESSION_FILE_PATH = path.resolve('./session.json');

async function startBot() {
  // Cargar versión de baileys compatible (opcional, ayuda a evitar problemas de versión)
  let version;
  try {
    const ver = await fetchLatestBaileysVersion();
    version = ver.version;
    logger.info('Usando versión de baileys:', version.join('.'));
  } catch (e) {
    logger.warn('No se pudo obtener la versión más reciente de Baileys, se usará la predeterminada.');
    version = undefined;
  }

  // Crea/usa el estado en un solo archivo (session.json)
  const { state, saveState } = useSingleFileAuthState(SESSION_FILE_PATH);

  // Opcional: store en memoria para mantener info de contactos/chats (útil en bots más avanzados)
  const store = makeInMemoryStore({ logger: logger.child({ level: 'silent' }) });

  // Instancia del socket
  const sock = makeWASocket({
    logger: logger,
    printQRInTerminal: true, // imprime QR en la terminal si hace falta escanear
    auth: state,
    version // si es undefined, Baileys usará la versión incluida
  });

  // Vincular eventos del store
  store.bind(sock.ev);

  // Guardar credenciales cuando cambien
  sock.ev.on('creds.update', saveState);

  // Manejar actualizaciones de conexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('Se generó QR para escaneo.');
    }

    if (connection) logger.info('connection update', connection);

    if (connection === 'close') {
      const reason = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) ?
        lastDisconnect.error.output.statusCode :
        null;

      logger.warn('Conexión cerrada. Razón:', reason);

      if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) {
        const statusCode = lastDisconnect.error.output.statusCode;
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          logger.error('La sesión fue desconectada (logged out). Eliminando session.json y finalizando.');
          try {
            fs.unlinkSync(SESSION_FILE_PATH);
          } catch (e) {}
          return;
        }
      }

      logger.info('Reiniciando bot en 5s...');
      setTimeout(() => startBot(), 5000);
    }

    if (connection === 'open') {
      logger.info('Conexión establecida correctamente.');
    }
  });

  // Manejar mensajes entrantes
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const messages = m.messages;
      if (!messages || messages.length === 0) return;

      for (const msg of messages) {
        if (!msg.message || (msg.key && msg.key.remoteJid === 'status@broadcast')) continue;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = (msg.key.participant) ? msg.key.participant : msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        let text = '';

        if (messageType === 'conversation') {
          text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
          text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' && msg.message.imageMessage.caption) {
          text = msg.message.imageMessage.caption;
        } else if (messageType === 'videoMessage' && msg.message.videoMessage.caption) {
          text = msg.message.videoMessage.caption;
        }

        if (!text) continue;

        const body = text.trim();

        logger.info({ from, sender, body: body });

        if (body === '!ping' || body === '/ping') {
          await sock.sendMessage(from, { text: 'Pong 🏓' }, { quoted: msg });
        } else if (body.startsWith('!echo ') || body.startsWith('/echo ')) {
          const echoText = body.split(' ').slice(1).join(' ');
          await sock.sendMessage(from, { text: echoText || 'Nada que repetir.' }, { quoted: msg });
        } else if (body === '!help' || body === '/help') {
          const helpMsg = [
            'Comandos disponibles:',
            '!ping - responde Pong',
            '!echo <texto> - repite el texto',
            '!help - muestra esta ayuda'
          ].join('\n');
          await sock.sendMessage(from, { text: helpMsg }, { quoted: msg });
        } else {
          if (isGroup && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.mentionedJid) {
            const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
            try {
              const myId = sock.user && sock.user.id ? sock.user.id : null;
              if (myId && mentions.includes(myId)) {
                await sock.sendMessage(from, { text: `¡Hola! Gracias por mencionarme.` }, { quoted: msg });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      logger.error('Error al procesar mensaje:', err);
    }
  });

  // Eventos adicionales (opcional)
  sock.ev.on('chats.update', (updates) => {});
  sock.ev.on('contacts.upsert', (contacts) => {});

  return sock;
}

// Ejecutar el bot
startBot().catch(e => {
  console.error('Error al iniciar el bot:', e);
  process.exit(1);
});
