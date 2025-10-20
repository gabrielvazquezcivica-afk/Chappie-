const countryFlags = {
  '54': '🇦🇷', // Argentina
  '55': '🇧🇷', // Brasil
  '52': '🇲🇽', // México
  '34': '🇪🇸', // España
  '1': '🇺🇸', // USA/Canadá
  '91': '🇮🇳', // India
  // Agrega más códigos de país y banderas según necesidad
};

function getFlagByPhone(phone) {
  const code = phone.split('@')[0].split('')[0] === '+' ? phone.split('@')[0].slice(1, phone.indexOf('9') > -1 ? phone.indexOf('9') : undefined) : phone.split('@')[0].slice(0, 2);
  // Intentar obtener el código de país (2 o 3 dígitos)
  let countryCode = phone.split('@')[0].slice(0, 2);
  if (countryFlags[countryCode]) return countryFlags[countryCode];
  countryCode = phone.split('@')[0].slice(0, 3);
  if (countryFlags[countryCode]) return countryFlags[countryCode];
  return '🏳️'; // bandera genérica si no se encuentra
}

module.exports = {
  name: 'todos',
  description: 'Menciona a todos los miembros con bandera de país. Solo admins si modoadmin está activo.',
  async execute({ conn, m, isGroup, groupMetadata, participants, isAdmin, isBotAdmin, modoadmin }) {
    if (!isGroup) {
      return await conn.reply(m.chat, 'Este comando solo funciona en grupos.', m);
    }

    if (modoadmin && !isAdmin) {
      return await conn.reply(m.chat, 'Solo los admins pueden usar este comando cuando el modoadmin está activo.', m);
    }

    const mentions = [];
    let message = '*Mencionando a todos los miembros del grupo:*\n\n';
    for (const user of participants) {
      const flag = getFlagByPhone(user.id);
      message += `${flag} @${user.id.split('@')[0]}\n`;
      mentions.push(user.id);
    }

    await conn.sendMessage(m.chat, { text: message, mentions }, { quoted: m });
  }
};