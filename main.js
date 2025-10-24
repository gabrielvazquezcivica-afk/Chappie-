// main.js
import { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import P from 'pino';
import readline from 'readline';

// Carpeta para la sesión
const SESSION_FILE = './ChappieSession.json';
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

async function startChappie() {
    // Leer opción del usuario
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Selecciona modo de conexión:');
    console.log('1) Escanear QR');
    console.log('2) Emparejamiento por código');

    rl.question('Introduce 1 o 2: ', async (option) => {
        rl.close();
        option = option.trim();

        if (option !== '1' && option !== '2') {
            console.log('Opción inválida, saliendo...');
            process.exit(0);
        }

        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: option === '1', // QR solo si opción 1
            logger: P({ level: 'silent' }),
            version
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log('❌ Conexión cerrada, razón:', reason);
                startChappie();
            } else if (connection === 'open') {
                console.log('✅ Conectado a WhatsApp');
            }

            if (qr && option === '1') {
                console.log('📌 Escanea este QR en tu WhatsApp:');
            }
        });

        sock.ev.on('creds.update', saveState);

        if (option === '2') {
            // Emparejamiento por código
            const rlCode = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rlCode.question('📞 Ingresa tu número (ejemplo: 5215512345678): ', async (number) => {
                rlCode.close();
                console.log(`🔑 Generando código de emparejamiento para ${number}...`);
                try {
                    const code = await sock.requestPairingCode(number.trim());
                    console.log(`✅ Código de emparejamiento para ${number}: ${code}`);
                } catch (e) {
                    console.log('❌ Error generando código:', e.message);
                }
            });
        }

        // Cargar plugins
        cargarPlugins(sock);
    });
}

// Función para cargar plugins
function cargarPlugins(sock) {
    const pluginsDir = './plugins';
    if (!fs.existsSync(pluginsDir)) {
        console.log('⚠️ Carpeta plugins no encontrada.');
        return;
    }

    const archivos = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    let total = 0;
    for (let file of archivos) {
        const filePath = path.join(pluginsDir, file);
        try {
            import(filePath).then(plugin => {
                if (plugin.default) plugin.default(sock);
                console.log(`⚙️ Plugin ${file} cargado`);
                total++;
            });
        } catch (e) {
            console.log(`❌ Error cargando ${file}:`, e.message);
        }
    }
    console.log(`📦 Total plugins cargados: ${total}`);
}

// Iniciar bot
startChappie();