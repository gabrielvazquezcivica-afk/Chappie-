const countryFlags = {
  'MX': '🇲🇽', // México
  'AR': '🇦🇷', // Argentina
  'ES': '🇪🇸', // España
  'CO': '🇨🇴', // Colombia
  'PE': '🇵🇪', // Perú
  'CL': '🇨🇱', // Chile
  'US': '🇺🇸', // USA
  // Agrega más países según tus necesidades
}

function getFlagByCountryCode(code = 'MX') {
  return countryFlags[code] || '🏳️‍🌈';
}

/**
 * Este evento debe ser llamado cuando el bot recibe un mensaje.
 * message: el objeto del mensaje recibido.
 * conn: conexión baileys
 */
async function handleTodosCommand(message, conn) {
  // Solo responde si el mensaje es en un grupo
  if (!message.key.remoteJid.endsWith('@g.us')) return;

  // Solo admins pueden usar el comando
  const groupMetadata = await conn.groupMetadata(message.key.remoteJid);
  const admins = groupMetadata.participants.filter(p => p.admin);
  const isAdmin = admins.some(a => a.id === message.key.participant || a.id === message.key.fromMe);

  if (!isAdmin) {
    await conn.sendMessage(message.key.remoteJid, { text: "❌ Solo los administradores pueden usar este comando." }, { quoted: message });
    return;
  }

  // Mencionar a todos con bandera
  const mentions = [];
  let text = "INVOCANDO MUEBLES 🗣️🔥:*\n\n";
  for (const participant of groupMetadata.participants) {
    const flag = getFlagByCountryCode(participant.countryCode); // Asegúrate de tener esta info
    text += `${flag} @${participant.id.split('@')[0]}\n`;
    mentions.push(participant.id);
  }

  await conn.sendMessage(message.key.remoteJid, {
    text,
    mentions
  }, { quoted: message });
}

// Exporta la función para usarla en tu sistema de comandos
module.exports = { handleTodosCommand };