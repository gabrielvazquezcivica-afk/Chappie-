import pino from 'pino';
import fs from 'fs';
import path from 'path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { serialize } from './lib/serialize.js';
import { color } from './lib/color.js';
import { smsg } from './lib/simple.js';
import { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } from './lib/functions.js';

/**
 * main.js
 * Bot básico de WhatsApp usando @whiskeysockets/baileys
 * Inspirado en: https://github.com/gabrielvazquezcivica-afk/ITACHI-BOT-/blob/main/main.js
 *
 * Instrucciones rápidas:
 * 1) Coloca este archivo en la raíz del repo (o en la carpeta que prefieras).
 * 2) Instala dependencias:
 *    npm install @whiskeysockets/baileys pino
 * 3) Ejecuta: node index.js
 * 4) Escanea el QR que aparecerá en la terminal (si no existe session.json).
 *
 * Este ejemplo es deliberadamente simple: maneja conexión/rea-conexión,
 * guarda sesión en session.json y responde comandos básicos.
 */

const logger = pino({ level: 'info' });

// Función principal para el inicio de sesión y conexión
async function main() {
    // Carga el estado de autenticación (sesión guardada)
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    // Crea el socket de WhatsApp
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,  // Muestra el QR en la terminal para escanear
        logger: logger,
    });

    // Maneja la actualización de credenciales (guarda la sesión)
    sock.ev.on('creds.update', saveCreds);

    // Maneja la conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;
            console.log('Conexión cerrada debido a:', lastDisconnect?.error, ', reconectando:', shouldReconnect);
            if (shouldReconnect) {
                main();  // Reconecta
            } else {
                console.log('Sesión expirada. Borra la carpeta ./session y reescanea el QR.');
            }
        } else if (connection === 'open') {
            console.log('Conectado exitosamente a WhatsApp!');
        }
    });

    // Maneja mensajes entrantes (ejemplo básico)
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            console.log('Mensaje recibido:', msg.message);
            // Aquí puedes agregar lógica para responder comandos
        }
    });

    // Mantén el proceso vivo
    return sock;
}

// Ejecuta la función principal
main().catch((err) => console.error('Error en main:', err));