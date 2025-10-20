/*
 * Comando: .todos
 * Función: Menciona a todos los participantes del grupo y añade una bandera de país aleatoria a cada mención.
 * Uso: Envía ".todos" en el grupo para mencionar a todos con una bandera.
 */

const countryFlags = [
  "🇦🇷", "🇧🇷", "🇨🇱", "🇨🇴", "🇪🇨", "🇪🇸", "🇺🇸", "🇵🇪", "🇵🇾", "🇲🇽", "🇺🇾", "🇻🇪", "🇬🇹", "🇩🇴", "🇸🇻", "🇭🇳", "🇳🇮", "🇨🇷", "🇵🇦", "🇧🇴"
];

async function onCommandTodos(m, { groupMetadata, sendMessage }) {
  if (!groupMetadata) return sendMessage(m.chat, 'Solo se puede usar en grupos.');

  const mentions = groupMetadata.participants
    .filter(p => !p.isAdmin && !p.isSuperAdmin) // opcional: excluir admins
    .map((p, idx) => ({
      jid: p.id,
      flag: countryFlags[idx % countryFlags.length]
    }));

  const mentionText = mentions.map(m => `${m.flag} @${m.jid.split('@')[0]}`).join('\n');

  await sendMessage(m.chat, mentionText, {
    mentions: mentions.map(m => m.jid)
  });
}

// Exporta tu handler para el bot
module.exports = {
  command: ['todos'],
  groupOnly: true,
  handler: onCommandTodos
};