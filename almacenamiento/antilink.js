// Requiere Baileys v7+
// Instala: npm install @whiskeysockets/baileys
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || !msg.key.remoteJid) continue;

      let text = "";
      // Extrae el texto del mensaje
      if (msg.message.conversation) text = msg.message.conversation;
      else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
      else continue;

      // Expresión regular para detectar links
      const regexLink = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\.com\b)|(\.net\b)|(\.org\b)/i;
      if (regexLink.test(text)) {
        try {
          // Elimina el mensaje con link
          await sock.sendMessage(msg.key.remoteJid, {
            delete: msg.key
          });

          // Envía aviso
          await sock.sendMessage(msg.key.remoteJid, {
            text: `🚫 No se permiten enlaces en este grupo. Tu mensaje fue eliminado.`
          }, { quoted: msg });
        } catch (err) {
          console.error("Error al borrar mensaje:", err);
        }
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
