const { getGroupAdmins } = require('./utils'); // función para obtener admins de un grupo

/**
 * Comando Kick para grupos de WhatsApp
 * @param {object} sock - Instancia de Baileys
 * @param {object} m - Mensaje recibido
 */
module.exports = async (sock, m) => {
    try {
        const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
        const groupAdmins = getGroupAdmins(groupMetadata.participants);
        const sender = m.key.participant || m.key.remoteJid;

        // Verifica que solo admins puedan usar el comando
        if (!groupAdmins.includes(sender)) {
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Solo los admins pueden usar este comando.' }, { quoted: m });
        }

        // Detecta el usuario a expulsar (por mención o respuesta)
        let target;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } else {
            return sock.sendMessage(m.key.remoteJid, { text: '❌ Menciona o responde al usuario que quieres expulsar.' }, { quoted: m });
        }

        // Verifica que el target no sea admin
        if (groupAdmins.includes(target)) {
            return sock.sendMessage(m.key.remoteJid, { text: '❌ No puedes expulsar a otro admin.' }, { quoted: m });
        }

        // Expulsa al usuario
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
        return sock.sendMessage(m.key.remoteJid, { text: `✅ Usuario expulsado correctamente.` }, { quoted: m });
    } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
};

// utils.js
// Función para obtener los admins de un grupo
// exports.getGroupAdmins = (participants) => participants.filter(p => p.admin).map(p => p.id);