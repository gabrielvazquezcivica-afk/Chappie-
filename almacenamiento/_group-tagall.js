const countryFlags = {
  "Mexico": "🇲🇽",
  "Argentina": "🇦🇷",
  "Colombia": "🇨🇴",
  "Chile": "🇨🇱",
  "Peru": "🇵🇪",
  "España": "🇪🇸",
  "EEUU": "🇺🇸",
  // Agrega más países y banderas si lo deseas
};

async function tagAllWithFlags(sock, groupChatId, membersInfo) {
  // membersInfo debe ser un array de objetos: { id: 'user@c.us', country: 'Mexico' }
  let mentions = [];
  let text = '';

  for (const member of membersInfo) {
    const flag = countryFlags[member.country] || '🏳️';
    text += `${flag} @${member.id.split('@')[0]}\n`;
    mentions.push(member.id);
  }

  await sock.sendMessage(groupChatId, { text, mentions });
}

// Ejemplo de uso:
// const membersInfo = [
//   { id: '1234567890@s.whatsapp.net', country: 'Mexico' },
//   { id: '0987654321@s.whatsapp.net', country: 'Argentina' },
//   // ... más miembros
// ];
// tagAllWithFlags(sock, '1234567890-1234567890@g.us', membersInfo);

module.exports = { tagAllWithFlags };