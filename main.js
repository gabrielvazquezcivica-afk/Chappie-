// main.js
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

// Nombre del bot
const BOT_NAME = 'Chappie-Bot';

// Inicialización del cliente con autenticación local
const client = new Client({
    authStrategy: new LocalAuth({ clientId: BOT_NAME })
});

// Eventos del cliente
client.on('qr', (qr) => {
    console.log(`\n[${BOT_NAME}] Escanea este QR:`);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(`\n[${BOT_NAME}] Conectado y listo para usar!`);
});

client.on('authenticated', () => {
    console.log(`\n[${BOT_NAME}] Sesión autenticada!`);
});

client.on('auth_failure', msg => {
    console.error(`[${BOT_NAME}] Fallo de autenticación: ${msg}`);
});

client.on('disconnected', (reason) => {
    console.log(`[${BOT_NAME}] Desconectado. Razón: ${reason}`);
});

// Cargar plugins dinámicamente desde la carpeta plugins
const pluginsPath = path.join('./plugins');
if (fs.existsSync(pluginsPath)) {
    const pluginFiles = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));
    console.log(`[${BOT_NAME}] Cargando plugins...`);
    for (const file of pluginFiles) {
        try {
            const plugin = await import(path.join(pluginsPath, file));
            console.log(`[${BOT_NAME}] Plugin cargado: ${file}`);
        } catch (err) {
            console.error(`[${BOT_NAME}] Error cargando ${file}: ${err.message}`);
        }
    }
} else {
    console.warn(`[${BOT_NAME}] Carpeta plugins no encontrada.`);
}

// Manejo básico de mensajes
client.on('message', async message => {
    const chat = await message.getChat();
    const body = message.body.toLowerCase();

    // Comandos básicos de ejemplo
    if (body === '!menu') {
        message.reply('📜 Aquí va el menú de comandos de Chappie-Bot');
    }
    if (body === '!welcome') {
        message.reply('👋 Bienvenido al grupo!');
    }

    // Plugins pueden agregar más comandos
});

// Inicializar el cliente
client.initialize();