const linkRegex = /(https?:\/\/[^\s]+)/gi;

let antilinkStatus = {}; // Guardamos el estado por grupo

// Evento de mensajes
async function onMessage({ m, sock }) {
    const groupId = m.key.remoteJid;

    // Solo grupos
    if (!groupId.endsWith('@g.us')) return;

    // Comando para admins
    if (m.message?.conversation?.startsWith('!antilink')) {
        const isAdmin = (await sock.groupMetadata(groupId))
            .participants.find(p => p.id === m.key.participant && p.admin);

        if (!isAdmin) {
            await sock.sendMessage(groupId, { text: 'Solo los administradores pueden usar este comando.' }, { quoted: m });
            return;
        }
        const args = m.message.conversation.split(' ');
        if (args[1] === 'on') {
            antilinkStatus[groupId] = true;
            await sock.sendMessage(groupId, { text: '🔗 Antilink activado.' }, { quoted: m });
        } else if (args[1] === 'off') {
            antilinkStatus[groupId] = false;
            await sock.sendMessage(groupId, { text: '🔗 Antilink desactivado.' }, { quoted: m });
        } else {
            await sock.sendMessage(groupId, { text: 'Uso: !antilink on/off' }, { quoted: m });
        }
        return;
    }

    // Antilink activo
    if (antilinkStatus[groupId]) {
        // Solo usuarios normales (no admins)
        const sender = m.key.participant || m.key.fromMe ? m.key.remoteJid : m.key.participant;
        const groupMetadata = await sock.groupMetadata(groupId);
        const senderData = groupMetadata.participants.find(p => p.id === sender);

        if (senderData && !senderData.admin && m.message && linkRegex.test(m.message.conversation || '')) {
            // Eliminar el mensaje
            await sock.sendMessage(groupId, {
                delete: m.key
            });
            // Aviso al grupo
            await sock.sendMessage(groupId, {
                text: `🚫 No se permiten enlaces en este grupo.`
            });
        }
    }
}

module.exports = { onMessage };
