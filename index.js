// index.js - Gestor principal y recargador automático para Chappie Bot
// Este código permite iniciar sesión usando un código de emparejamiento (pairing code) en lugar de QR.
// Requiere que proporciones un número de teléfono válido para el bot.

const { spawn } = import('child_process');
const path = import('path');
const fs = import('fs');

let child = null;

// Función para iniciar el proceso principal (main.js)
function startMain() {
    if (child) {
        child.kill();
    }
    child = spawn('node', [path.join(__dirname, 'main.js')], {
        stdio: 'inherit',
        cwd: __dirname
    });
    child.on('exit', (code) => {
        console.log(`Proceso principal terminó con código ${code}. Reiniciando...`);
        startMain();
    });
}

// Inicia el proceso principal al cargar
startMain();

// Manejo de señales para reinicio manual
process.on('SIGUSR1', () => {
    console.log('Reiniciando Chappie Bot...');
    startMain();
});

// Nota: Para usar pairing code, modifica main.js para incluir lógica de autenticación con código.
// Ejemplo básico en main.js (agrega esto dentro de la función de conexión):
//
// const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
// 
// async function connectToWhatsApp() {
//     const { state, saveCreds } = await useMultiFileAuthState('./session');
//     const sock = makeWASocket({
//         auth: state,
//         printQRInTerminal: false, // Desactiva QR
//     });
//     
//     sock.ev.on('connection.update', async (update) => {
//         const { connection, lastDisconnect, qr } = update;
//         if (connection === 'close') {
//             const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
//             if (shouldReconnect) {
//                 connectToWhatsApp();
//             }
//         } else if (connection === 'open') {
//             console.log('Conectado a WhatsApp');
//         }
//     });
//     
//     sock.ev.on('creds.update', saveCreds);
//     
//     // Para pairing code: solicita el código para un número específico
//     if (!sock.authState.creds.registered) {
//         const phoneNumber = 'TU_NUMERO_DE_TELEFONO_AQUI'; // Reemplaza con el número del bot (ej: '1234567890')
//         const code = await sock.requestPairingCode(phoneNumber);
//         console.log(`Código de emparejamiento: ${code}`);
//         // El código se envía al número de teléfono. Úsalo para emparejar en WhatsApp.
//     }
//     
//     return sock;
// }
//
// connectToWhatsApp();
//
// Recuerda instalar las dependencias con npm install y reemplazar 'TU_NUMERO_DE_TELEFONO_AQUI' con un número válido.
// Este es un ejemplo simplificado; adapta según tu lógica existente en main.js.