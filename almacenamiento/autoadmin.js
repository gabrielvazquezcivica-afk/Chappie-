const { WA_DEFAULT_EPHEMERAL } = import('@adiwajshing/baileys');
const handler = async (m, { conn, participants, isAdmin, isBotAdmin }) => {
  // Solo permite ejecutar el comando en grupos
  if (!m.isGroup) throw '*Este comando solo puede usarse en grupos*';
  // Verifica si el bot es administrador
  if (!isBotAdmin) throw '*El bot necesita ser administrador para ejecutar este comando*';

  // ID del dueño (ajusta si tienes más de uno)
  const ownerNumber = global.owner[0] + "@s.whatsapp.net";
  // El dueño debe estar en el grupo
  if (!participants.some(p => p.id === ownerNumber))
    throw '*El dueño no está en este grupo*';

  // Verifica si el dueño ya es admin
  let ownerIsAdmin = participants.some(p => p.id === ownerNumber && p.admin);
  if (ownerIsAdmin)
    return m.reply('*Ya eres administrador del grupo*');

  // Promociona al dueño como admin
  await conn.groupParticipantsUpdate(m.chat, [ownerNumber], 'promote');
  m.reply('*Dueño promovido a administrador correctamente*');
};

handler.help = ['autoadmin'];
handler.tags = ['owner'];
handler.command = /^autoadmin$/i;
handler.owner = true; // Solo el dueño puede usar este comando

module.exports = handler;