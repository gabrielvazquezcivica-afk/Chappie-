// main.js
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useSingleFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import P from 'pino';
import readline from 'readline';

// Carpeta de sesión
const SESSION_FILE = './ChappieSession.json';
const { state, saveCreds } = await useSingleFileAuthState(SESSION_FILE);

// Leer comandos desde almacenamiento
const pluginsFolder = path.join('./almacenamiento');
let comandos = [];
if (fs.existsSync(pluginsFolder)) {
    const files = fs.readdirSync(pluginsFolder);
    for (let file of files) {
        if (file.endsWith('.js')) comandos.push(file);
    }
}

// Función principal
export async function startChappie() {
    console.log('===============================');
    console.log('⚙️  Iniciando Chappie-Bot');
    console.log('===============================');

    // Preguntar modo de conexión
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Selecciona modo de conexión:\n1) Escanear QR\n2) Emparejamiento por código\nIntroduce 1 o 2: ', async (modo) => {
        let sock;
        const [version] = await fetchLatestBaileysVersion();

        if (modo.trim() === '1') {
            console.log('🔑 Modo QR seleccionado');
            sock = makeWASocket({ 
                logger: P({ level: 'silent' }),
                printQRInTerminal: true,
                auth: state,
                version
            });
        } else if (modo.trim() === '2') {
            rl.question('📞 Ingresa tu número (ejemplo: 5215512345678): ', async (numero) => {
                console.log(`🔑 Modo CODEBOT seleccionado para el número: ${numero}`);
                try {
                    sock = makeWASocket({ auth: state, version });
                    // Aquí se debería generar el emparejamiento por código usando Baileys
                } catch (e) {
                    console.log('❌ Error en emparejamiento:', e);
                }
            });
        } else {
            console.log('❌ Opción inválida');
            rl.close();
            return;
        }

        if (sock) {
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                console.log('update connection:', update);
                if (connection === 'close') {
                    const reason = (lastDisconnect?.error)?.output?.statusCode;
                    console.log(`❌ Conexión cerrada, razón: ${reason}`);
                } else if (connection === 'open') {
                    console.log('✅ Conectado a WhatsApp');
                }
            });

            sock.ev.on('creds.update', saveCreds);

            // Listener de mensajes
            sock.ev.on('messages.upsert', async (msg) => {
                const m = msg.messages[0];
                if (!m.message) return;
                const body = m.message.conversation || '';
                // Buscar comando
                comandos.forEach(cmdFile => {
                    import(path.join(pluginsFolder, cmdFile)).then(mod => {
                        if (mod?.default) mod.default(sock, m, body);
                    });
                });
            });
        }
        rl.close();
    });
}