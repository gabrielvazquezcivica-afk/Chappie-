// Compatibilidad robusta con distintas exportaciones de @adiwajshing/baileys
const rawBaileys = require('@adiwajshing/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const fs = require('fs');

// Si el paquete se exportó como default (ESM transpiled), usa ese objeto; si no, usa rawBaileys
const BAILEYS = (rawBaileys && rawBaileys.default) ? rawBaileys.default : rawBaileys;

// Desestructura las funciones/clases que necesitamos
const {
  useSingleFileAuthState,
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason
} = BAILEYS || {};

// Si algo falta, imprime debug con las claves exportadas
if (typeof useSingleFileAuthState !== 'function' || typeof makeWASocket === 'undefined') {
  console.error('La versión de @adiwajshing/baileys instalada no proporciona useSingleFileAuthState o makeWASocket en el formato esperado.');
  console.error('Recomiendo instalar @adiwajshing/baileys@^5.0.0 con: npm install @adiwajshing/baileys@^5.0.0 --save');
  try {
    console.error('Exported keys from require("@adiwajshing/baileys"):', Object.keys(rawBaileys || {}).join(', '));
    if (rawBaileys && rawBaileys.default) {
      console.error('Exported keys from require("@adiwajshing/baileys").default:', Object.keys(rawBaileys.default || {}).join(', '));
    }
  } catch (e) {
    console.error('No se pudo obtener keys de debug:', e);
  }
  process.exit(1);
}

const AUTH_FILE = './auth_info.json';
const QR_IMAGE = './qr.png';

async function start() {
  // Crea o carga archivo de sesión
  const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

  // Obtener versión recomendada (si falla, usamos undefined)
  let version;
  try {
    const verRes = await fetchLatestBaileysVersion();
    version = verRes?.version;
  } catch (e) {
    version = undefined;
  }

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    version
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcodeTerminal.generate(qr, { small: true });
      console.log('----- QR string (puedes copiarlo si no puedes escanear el terminal) -----');
      console.log(qr);

      try {
        await qrcode.toFile(QR_IMAGE, qr);
        console.log(`QR guardado en ${QR_IMAGE}`);
      } catch (err) {
        console.warn('No se pudo guardar QR como imagen:', err);
      }
    }

    if (connection === 'open') {
      console.log('Conectado a WhatsApp ✅');
      try { if (fs.existsSync(QR_IMAGE)) fs.unlinkSync(QR_IMAGE); } catch (e) {}
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.message;
      console.log('Conexión cerrada:', reason);

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason?.loggedOut || statusCode === 401) {
        console.log('La sesión fue cerrada (logged out). Elimina el archivo de sesión y vuelve a iniciar para obtener un nuevo QR.');
      } else {
        console.log('Reiniciando socket...');
        start().catch(err => console.error('Error reiniciando:', err));
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message?.extendedTextMessage?.text || '';

    console.log(`Mensaje de ${from}:`, text);

    if (text.toLowerCase().trim() === 'ping') {
      await sock.sendMessage(from, { text: 'pong' });
    }
  });

  process.on('SIGINT', async () => {
    console.log('Cerrando socket...');
    await sock.logout().catch(() => {});
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Error al iniciar el bot:', err);
  process.exit(1);
});
