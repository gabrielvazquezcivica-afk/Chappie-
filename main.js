// main.js - Lógica principal del bot de WhatsApp usando Baileys
// Maneja conexión, QR, mensajes y comandos básicos.

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

// Función principal para conectar y manejar el bot
async function startBot() {
    // Usar estado de autenticación multi-archivo (guarda sesión en ./auth_info_baileys/)
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    // Crear socket de WhatsApp
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: true,  // Imprime el QR en la terminal
        logger: pino({ level: 'info' }),  // Logs para depuración
        browser: ['Chappie Bot', 'Chrome', '1.0.0']  // Nombre del bot
    });

    // Manejar actualizaciones de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log('Actualización de conexión:', update);  // Log para depurar

        if (qr) {
            // Mostrar QR code para escanear
            console.log('Escanea este QR code con WhatsApp:');
            console.log(qr);
            // Opcional: Generar imagen QR (requiere 'qrcode' instalado)
            // const QRCode = require('qrcode');
            // await QRCode.toFile('./qr.png', qr);
            // console.log('QR guardado en qr.png');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada. Razón:', lastDisconnect?.error?.output?.statusCode);

            if (shouldReconnect) {
                console.log('Reconectando...');
                startBot();  // Reconectar automáticamente
            } else {
                console.log('Sesión cerrada. Borra ./auth_info_baileys/ y escanea el QR nuevamente.');
            }
        } else if (connection === 'open') {
            console.log('¡Bot conectado a WhatsApp exitosamente!');
        }
    });

    // Guardar credenciales cuando se actualicen
    sock.ev.on('creds.update', saveCreds);

    // Manejar mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

            // Comandos básicos (expande aquí o carga desde ./almacenamiento/)
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

            // Ejemplo: Cargar comandos adicionales desde ./almacenamiento/
            // const commandFiles = fs.readdirSync('./almacenamiento/').filter(file => file.endsWith('.js'));
            // for (const file of commandFiles) {
            //     const command = require(`./almacenamiento/${file}`);
            //     if (command.execute) await command.execute(sock, msg);
            // }
        }
    });

    return sock;
}

module.exports = { startBot };