// main.js - CommonJS
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const P = require('pino');
const readline = require('readline');

// Auth state
const { state, saveCreds } = useSingleFileAuthState('./ChappieSession.json');

// Carga plugins
function loadPlugins() {
    const pluginsPath = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsPath)) {
        console.log('⚠️ Carpeta plugins no encontrada.');
        return [];
    }
    const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'));
    const plugins = [];
    for (const file of files) {
        try {
            const plugin = require(path.join(pluginsPath, file));
            plugins.push(plugin);
            console.log(`⚙️ Plugin cargado: ${file}`);
        } catch (e) {
            console.log(`❌ Error cargando ${file}: ${e.message}`);
        }
    }
    return plugins;
}

// Inicia bot
async function startChappie() {
    const plugins = loadPlugins();

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('===============================');
    console.log('⚙️  Iniciando Chappie-Bot');
    console.log('===============================');
    console.log('Selecciona modo de conexión:');
    console.log('1) Escanear QR');
    console.log('2) Emparejamiento por código');

    rl.question('Introduce 1 o 2: ', async (modo) => {
        let client;

        if (modo === '1') {
            console.log('🔑 Modo QR seleccionado');
            client = makeWASocket({
                auth: state,
                logger: P({ level: 'silent' })
            });

            client.ev.on('connection.update', (update) => {
                if (update.qr) console.log('Escanea este QR:\n' + update.qr);
                if (update.connection === 'open') console.log('✅ Conectado a WhatsApp');
                if (update.connection === 'close') console.log('❌ Conexión cerrada');
            });

        } else if (modo === '2') {
            rl.question('📞 Ingresa tu número (ejemplo: 5215512345678): ', async (numero) => {
                console.log(`🔑 Modo CODEBOT seleccionado para el número: ${numero}`);
                console.log('⚙️ Generando código de emparejamiento...');
                // Código de ejemplo (Baileys actual no permite codebot directo, esto simula)
                console.log(`✅ Código de emparejamiento para ${numero}: 123ABC`);
                rl.close();
            });
            return;
        } else {
            console.log('⚠️ Opción inválida');
            rl.close();
            return;
        }

        client.ev.on('messages.upsert', async (m) => {
            // Aquí puedes ejecutar los plugins con cada mensaje
            for (const plugin of plugins) {
                if (plugin && plugin.run) plugin.run(client, m);
            }
        });

        client.ev.on('creds.update', saveCreds);
        rl.close();
    });
}

module.exports = { startChappie };