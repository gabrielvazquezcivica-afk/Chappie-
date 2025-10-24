export default {
    name: '_autodetect',
    execute: async (client, message) => {
        try {
            // Solo eventos de grupos
            if (!message.key.remoteJid.endsWith('@g.us')) return false;

            const jid = message.key.remoteJid;
            const sender = message.key.participant || message.key.remoteJid; // quien ejecutó la acción
            const senderTag = `@${sender.split('@')[0]}`;

            const msgType = Object.keys(message.message)[0];

            switch (msgType) {
                case 'groupParticipantsUpdate':
                    const update = message.message.groupParticipantsUpdate;
                    for (const participant of update.participants) {
                        const userTag = `@${participant.split('@')[0]}`;
                        if (update.action === 'promote') {
                            await client.sendMessage(jid, { text: `🔼 ${userTag} fue promovido a admin por ${senderTag}` }, { mentions: [participant, sender] });
                        } else if (update.action === 'demote') {
                            await client.sendMessage(jid, { text: `🔽 ${userTag} fue degradado de admin por ${senderTag}` }, { mentions: [participant, sender] });
                        }
                        // Eliminamos bienvenida o salida
                    }
                    break;

                case 'groupUpdate':
                    const updateType = message.message.groupUpdate.update;
                    if (updateType === 'subject') {
                        await client.sendMessage(jid, { text: `✏️ El nombre del grupo cambió a "${message.message.groupUpdate.subject}" por ${senderTag}` }, { mentions: [sender] });
                    } else if (updateType === 'description') {
                        await client.sendMessage(jid, { text: `📝 La descripción del grupo cambió por ${senderTag}` }, { mentions: [sender] });
                    } else if (updateType === 'icon') {
                        await client.sendMessage(jid, { text: `🖼️ La foto del grupo fue cambiada por ${senderTag}` }, { mentions: [sender] });
                    }
                    break;

                default:
                    return false;
            }

            return true; // plugin ejecutado correctamente
        } catch (e) {
            console.error('Error en _autodetect:', e);
            return false;
        }
    }
};