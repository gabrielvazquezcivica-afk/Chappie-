// main.js - Lógica principal del bot de WhatsApp usando Baileys
// Este archivo maneja la conexión a WhatsApp, genera el QR code y procesa mensajes básicos.

const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore
} = require('@adiwajshing/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');

// Función para conectar al bot
async function connectToWhatsApp() {
    // Usar estado de autenticación multi-archivo (guarda sesión en ./auth_info_baileys/)
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    // Crear socket de WhatsApp
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: true,  // Imprime el QR en la terminal
        logger: pino({ level: 'silent' }),  // Logs silenciosos
        browser: ['Chappie Bot', 'Chrome', '1.0.0']  // Nombre del bot en WhatsApp
    });

    // Manejar actualizaciones de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Mostrar QR code para escanear
            console.log('Escanea este QR code con WhatsApp:');
            console.log(qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Razón:', lastDisconnect?.error?.output?.statusCode);

            if (shouldReconnect) {
                console.log('Reconectando...');
                connectToWhatsApp();  // Reconectar automáticamente
            } else {
                console.log('Sesión cerrada. Escanea el QR nuevamente.');
            }
        } else if (connection === 'open') {
            console.log('¡Bot conectado a WhatsApp exitosamente!');
        }
    });

    // Guardar credenciales cuando se actualicen
    sock.ev.on('creds.update', saveCreds);

    // Manejar mensajes entrantes (lógica básica)
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

            // Comandos básicos (puedes expandir con más lógica)
            if (body.startsWith('!ping') || body.startsWith('/ping')) {
                await sock.sendMessage(from, { text: 'Pong 🏓' });
            } else if (body.startsWith('!echo ') || body.startsWith('/echo ')) {
                const text = body.slice(6);
                await sock.sendMessage(from, { text: text });
            } else if (body.startsWith('!help') || body.startsWith('/help')) {
                const helpText = `
Comandos disponibles:
- !ping / /ping: Responde Pong
- !echo <texto> / /echo <texto>: Repite el texto
- !help / /help: Muestra esta ayuda
                `;
                await sock.sendMessage(from, { text: helpText });
            }

            // Aquí puedes integrar comandos adicionales desde la carpeta almacenamiento/
            // Ejemplo: require('./almacenamiento/comando.js')(sock, msg);
        }
    });

    return sock;
}

// Iniciar el bot
connectToWhatsApp().catch(console.error);
