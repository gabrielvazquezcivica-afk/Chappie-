const { makeWASocket, useMultiFileAuthState, DisconnectReason, getContentType } = require('@whiskeysockets/baileys');

let modoAdmin = true; // Cambia a false para desactivar el modo admin

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;
        if (!modoAdmin) return; // Solo responde si el modo admin está activo

        const contentType = getContentType(msg.message);

        // Mensaje de texto
        if (contentType === 'conversation' && msg.message.conversation.startsWith('.n ')) {
            const textoNota = msg.message.conversation.slice(3).trim();
            if (textoNota.length > 0) {
                await sock.sendMessage(msg.key.remoteJid, { text: textoNota }, { quoted: msg });
            }
        }

        // Sticker
        if (contentType === 'stickerMessage' && msg.message.stickerMessage.caption && msg.message.stickerMessage.caption.startsWith('.n')) {
            await sock.sendMessage(msg.key.remoteJid, { sticker: msg.message.stickerMessage }, { quoted: msg });
        }

        // Audio
        if (contentType === 'audioMessage' && msg.message.audioMessage.caption && msg.message.audioMessage.caption.startsWith('.n')) {
            await sock.sendMessage(msg.key.remoteJid, { audio: msg.message.audioMessage, mimetype: 'audio/mp4' }, { quoted: msg });
        }

        // Encuesta (poll)
        if (contentType === 'pollCreationMessage' && msg.message.pollCreationMessage.name.startsWith('.n')) {
            await sock.sendMessage(msg.key.remoteJid, { poll: msg.message.pollCreationMessage }, { quoted: msg });
        }
    });
}

startBot();