import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const startChappie = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('ChappieSession');

    const chappie = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    // ------------------- CARGA DE PLUGINS -------------------
    const pluginsDir = path.resolve('./plugins');
    if (!fs.existsSync(pluginsDir)) {
        console.log(chalk.red('[❌] Carpeta plugins no encontrada.'));
    } else {
        const pluginFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
        pluginFiles.forEach(async file => {
            try {
                const pluginPath = path.join(pluginsDir, file);
                const plugin = await import(`file://${pluginPath}`);
                if (plugin.default) plugin.default(chappie, chalk);
                console.log(chalk.green('[✔ Plugin cargado:]'), chalk.blue(file));
            } catch (err) {
                console.log(chalk.red('[❌ Error cargando plugin:]'), chalk.yellow(file), err.message);
            }
        });
    }

    // ------------------- EVENTOS DE CONEXIÓN -------------------
    chappie.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log(chalk.blueBright('[QR] Escanea este QR:'), chalk.cyan(qr));
        if (connection === 'open') console.log(chalk.green('[✔ Conectado a WhatsApp]'));
        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode || 'unknown';
            console.log(chalk.red('[✖ Conexión cerrada] Reason:'), chalk.yellow(reason));
        }
    });

    // ------------------- MENSAJES ENTRANTES -------------------
    chappie.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const content = msg.message.conversation || msg.message.extendedTextMessage?.text || 'Media/otro tipo de mensaje';

        // Mensaje recibido
        console.log(chalk.yellow('[📥 Mensaje]'), chalk.magenta(from), ':', chalk.white(content));

        // Comando
        if (content.startsWith('.')) {
            console.log(chalk.green('[⚡ Comando]'), chalk.blue(content));

            // Ejemplo simple de comando
            if (content === '.ping') {
                await chappie.sendMessage(from, { text: 'Pong!' });
                console.log(chalk.green('[✔ Comando ejecutado]'), chalk.blue(content));
            }
        }
    });

    return chappie;
};

export { startChappie };