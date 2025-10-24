// main.js
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import Pino from 'pino';

const logger = Pino({ level: 'info' });
const PLUGINS_DIR = './plugins';

export async function startChappie() {
    // Inicializa el estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession');

    const { version } = await fetchLatestBaileysVersion();

    const chappie = makeWASocket({
        logger,
        printQRInTerminal: true,
        auth: state,
        version,
    });

    // Guardar credenciales automáticamente
    chappie.ev.on('creds.update', saveCreds);

    // Reconexión automática
    chappie.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode || 'unknown';
            logger.info(`Conexión cerrada, razón: ${reason}. Reconectando...`);
            startChappie(); // reinicia el bot
        } else if (connection === 'open') {
            logger.info('✅ Conectado a WhatsApp');
        }
    });

    // Cargar plugins automáticamente
    if (!fs.existsSync(PLUGINS_DIR)) {
        logger.warn('⚠️ Carpeta plugins no encontrada.');
    } else {
        const pluginFiles = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
        for (const file of pluginFiles) {
            try {
                const pluginPath = path.resolve(PLUGINS_DIR, file);
                const plugin = await import(pluginPath);
                if (plugin?.default) {
                    plugin.default(chappie);
                    logger.info(`⚙️ Plugin cargado: ${file}`);
                }
            } catch (err) {
                logger.error(`❌ Error cargando ${file}: ${err.message}`);
            }
        }
    }

    // Ejemplo de evento de mensaje
    chappie.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        if (text.startsWith('.ping')) {
            await chappie.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
        }
    });

    return chappie;
}