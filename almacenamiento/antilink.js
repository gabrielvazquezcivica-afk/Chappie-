/*
 * Comando: antilink 1 / antilink 0
 * Función: Activa o desactiva el sistema antilink en el grupo. El bot eliminará o advertirá a usuarios que envíen enlaces no permitidos.
 * Uso: Envía "antilink 1" para activar, "antilink 0" para desactivar el filtro de enlaces.
 */

let antilinkGroups = {};

async function onCommandAntilink(m, { groupMetadata, sendMessage }) {
  if (!groupMetadata) return sendMessage(m.chat, 'Este comando solo funciona en grupos.');

  const groupId = m.chat;
  const text = m.text || "";

  if (text.includes("1")) {
    antilinkGroups[groupId] = true;
    await sendMessage(groupId, '✅ Antilink activado.\nLos mensajes con enlaces serán eliminados o advertidos.');
  } else if (text.includes("0")) {
    antilinkGroups[groupId] = false;
    await sendMessage(groupId, '🚫 Antilink desactivado.\nYa se permiten enlaces en este grupo.');
  } else {
    await sendMessage(groupId, 'Uso: antilink 1 (activar) | antilink 0 (desactivar)');
  }
}

// Handler para mensajes (debes integrarlo en tu sistema de escucha de mensajes)
async function onMessage(m, { sendMessage }) {
  const groupId = m.chat;
  if (!antilinkGroups[groupId]) return;

  // Regex para detectar enlaces
  const linkRegex = /(https?:\/\/[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/i;

  if (linkRegex.test(m.text) && !m.fromMe) {
    try {
      await sendMessage(groupId, `🚫 @${m.sender.split('@')[0]}, no se permiten enlaces en este grupo.`, {
        mentions: [m.sender]
      });
      // Si tu framework lo permite:
      // await deleteMessage(groupId, m.key);
    } catch (e) {
      sendMessage(groupId, 'No tengo permisos suficientes para eliminar mensajes.');
    }
  }
}

module.exports = {
  command: ['antilink'],
  groupOnly: true,
  handler: onCommandAntilink,
  onMessage
};
