const linkRegex = /(https?:\/\/)?(www\.)?(chat\.whatsapp\.com|wa\.me|bit\.ly|t\.me|discord\.gg|instagram\.com|facebook\.com|youtu\.be|youtube\.com|twitter\.com|tiktok\.com|telegram\.me|telegram\.dog)\/[^\s]+/gi;

const antilink = require('./antilink.js');
client.on('message', async message => {
    await antilink(client, message);
});

async function antilinkHandler(sock, message, groupMetadata) {
    try {
        // Verifica que el mensaje es de grupo y que no es del propio bot
        if (!message.key.remoteJid.endsWith('@g.us') || message.key.fromMe) return;

        const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (linkRegex.test(texto)) {
            // Elimina el mensaje si el bot es admin
            const groupAdmins = groupMetadata.participants
                .filter(p => p.admin !== null)
                .map(p => p.id);

            if (groupAdmins.includes(sock.user.id)) {
                await sock.sendMessage(message.key.remoteJid, { text: '❌ Los enlaces no están permitidos.' }, { quoted: message });
                await sock.sendMessage(message.key.remoteJid, { delete: message.key });
            } else {
                await sock.sendMessage(message.key.remoteJid, { text: 'Se detectó un enlace, pero no soy admin para eliminar el mensaje.' }, { quoted: message });
            }
        }
    } catch (e) {
        console.error('Error en antilink:', e);
    }
}

module.exports = { antilinkHandler };
