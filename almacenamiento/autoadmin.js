// owner_autoadmin.js
// Este módulo otorga privilegios de administrador al dueño del bot en un grupo de WhatsApp si aún no los tiene.
// Debes integrarlo en tu bot de WhatsApp basado en Baileys, Venom, wppconnect o similar.

// Configura aquí el número del dueño del bot (en formato internacional sin '+' y sin espacios).
const OWNER_NUMBER = "523310167470"; // Ejemplo: "5212345678901"

// Esta función verifica si el dueño es admin y lo otorga si no lo es.
async function autoGrantAdmin(sock, groupId) {
    try {
        // Obtiene los participantes del grupo
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;

        // Busca al dueño entre los participantes
        const owner = participants.find(p => 
            p.id === OWNER_NUMBER + "@s.whatsapp.net"
        );

        if (!owner) return; // El dueño no está en el grupo

        // ¿El dueño ya es admin?
        if (owner.admin === "admin" || owner.admin === "superadmin") {
            // Ya es admin, no hacemos nada
            return;
        }

        // Otorgar admin al dueño (solo si el bot es admin)
        const me = participants.find(p => p.id === sock.user.id);
        if (me && (me.admin === "admin" || me.admin === "superadmin")) {
            await sock.groupParticipantsUpdate(
                groupId,
                [OWNER_NUMBER + "@s.whatsapp.net"],
                "promote"
            );
            console.log(`[AutoAdmin] Se otorgó admin al dueño en el grupo ${groupId}`);
        }
    } catch (e) {
        console.error("[AutoAdmin] Error:", e);
    }
}

// Ejemplo de integración: Llama esta función cuando el bot sea agregado a un grupo o ante cada mensaje de grupo.
module.exports = autoGrantAdmin;

/*
Ejemplo de uso con Baileys (dentro de tu manejador de eventos):

const autoGrantAdmin = require('./owner_autoadmin.js');

sock.ev.on('groups.upsert', async groups => {
    for (const group of groups) {
        await autoGrantAdmin(sock, group.id);
    }
});

// O en cada mensaje de grupo:
sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (msg.key.remoteJid.endsWith('@g.us')) {
        await autoGrantAdmin(sock, msg.key.remoteJid);
    }
});
*/