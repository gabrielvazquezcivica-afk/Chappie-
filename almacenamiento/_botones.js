const { makeWASocket, useMultiFileAuthState, MessageType } = import('@whiskeysockets/baileys');
const BOT_NAME = "Chappie 🔱"; // Cambia esto por el nombre real de tu bot

// Variable global para modo admin
let modoAdmin = true; // Cambia a false para desactivar

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

        // Solo ejecuta si el modo admin está activo
        if (!modoAdmin) return;

        // Detecta si el mensaje es .n (ya sea en texto, o como reply)
        let esComandoN = false;
        let textoNota = "";

        if (msg.message.conversation && msg.message.conversation.startsWith('.n')) {
            esComandoN = true;
            textoNota = msg.message.conversation.slice(2).trim();
        } else if (msg.message?.extendedTextMessage?.text?.startsWith('.n')) {
            esComandoN = true;
            textoNota = msg.message.extendedTextMessage.text.slice(2).trim();
        }

        if (esComandoN) {
            let contenidoReenviar;
            // Si el mensaje es reply, reenvía el mensaje citado
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                contenidoReenviar = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            } else if (textoNota) {
                // Si .n va seguido de texto, envía ese texto
                contenidoReenviar = { text: textoNota };
            } else {
                // Si solo .n, responde que cite un mensaje o escriba texto
                await sock.sendMessage(msg.key.remoteJid, {
                    text: "Usa .n como respuesta a un mensaje, sticker, audio, encuesta, o seguido de texto."
                }, { quoted: msg });
                return;
            }

            // Envía el contenido y firma en gris
            await sock.sendMessage(msg.key.remoteJid, contenidoReenviar, { quoted: msg });
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `> ${BOT_NAME}`,
                    contextInfo: { forwardingScore: 999, isForwarded: true }
                }
            );
        }
    });
}

startBot();