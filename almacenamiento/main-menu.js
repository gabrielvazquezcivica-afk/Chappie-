import axios from 'axios';

// Utilidad para convertir milisegundos en formato hh:mm:ss
const clockString = ms => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

// Saludo dinámico según la hora
const saludarSegunHora = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return '⏰ ¡Buenos días!';
  if (hora >= 12 && hora < 19) return '🌞 ¡Buenas tardes!';
  return '🌙 ¡Buenas noches!';
};

// Imagen de respaldo
const img = 'https://i.postimg.cc/158y1GrS/1ef93208974f3271c773e4deda477919.jpg';
const sectionDivider = '╰━━━━━━━━━━━━━━━━━━⭓';

// Pie de menú
const menuFooter = `
╭─❒ 「📌 INFO FINAL」
│ Usa los comandos con el prefijo correspondiente
│ Ejemplo: .ping | .menu
│ Bot: Chappie-Bot
╰❒
`.trim();

// Extensión para obtener un elemento aleatorio de un array
Array.prototype.getRandom = function () {
  return this[Math.floor(Math.random() * this.length)];
};

const handler = async (m, { conn, usedPrefix }) => {
  try {
    const saludo = saludarSegunHora();
    const user = global.db?.data?.users?.[m.sender] || { level: 1, exp: 0, limit: 5 };
    const { exp, level, limit } = user;
    const totalUsers = Object.keys(global.db?.data?.users || {}).length;
    const uptime = clockString(process.uptime() * 1000);
    const tagUsuario = `@${m.sender.split('@')[0]}`;
    const userName = (await conn.getName?.(m.sender)) || tagUsuario;

    const text = [
      "¡Bienvenido al menú de Chappie-Bot!",
      "Explora los comandos disponibles",
      "¿En qué puedo ayudarte hoy?"
    ].getRandom();

    const imgRandom = [
      "https://iili.io/FKVDVAN.jpg",
      "https://iili.io/FKVbUrJ.jpg"
    ].getRandom();

    let thumbnailBuffer;
    try {
      const response = await axios.get(imgRandom, { responseType: 'arraybuffer' });
      thumbnailBuffer = Buffer.from(response.data);
    } catch (e) {
      const fallback = await axios.get(img, { responseType: 'arraybuffer' });
      thumbnailBuffer = Buffer.from(fallback.data);
    }

    const menuMsg = {
      key: { participants: "0@s.whatsapp.net", fromMe: false, id: "ChappieMenu" },
      message: {
        locationMessage: {
          name: text,
          jpegThumbnail: thumbnailBuffer
        }
      },
      participant: "0@s.whatsapp.net"
    };

    // Categorización de comandos (puedes adaptar los tags a tu bot)
    let categorizedCommands = {};
    Object.values(global.plugins)
      .filter(p => p?.help && !p.disabled)
      .forEach(p => {
        const tag = Array.isArray(p.tags) ? p.tags[0] : p.tags || 'Otros';
        const cmds = Array.isArray(p.help) ? p.help : [p.help];
        categorizedCommands[tag] = categorizedCommands[tag] || new Set();
        cmds.forEach(cmd => categorizedCommands[tag].add(usedPrefix + cmd));
      });

    // Emojis de ejemplo para cada categoría
    const categoryEmojis = {
      info: 'ℹ️', utilidades: '🛠️', diversión: '🎉', stickers: '🎨',
      descargas: '📥', imagen: '🖼️', otros: '📁'
    };

    const menuBody = Object.entries(categorizedCommands).map(([title, cmds]) => {
      const emoji = categoryEmojis[title.toLowerCase()] || '📁';
      const list = [...cmds].map(cmd => `│ ◦ ${cmd}`).join('\n');
      return `╭─「 ${emoji} ${title.toUpperCase()} 」\n${list}\n${sectionDivider}`;
    }).join('\n\n');

    const header = `
${saludo} ${tagUsuario} 👋

╭─ 「 Chappie-Bot 🦾 」
│ 👤 Nombre: ${userName}
│ ⏱️ Tiempo activo: ${uptime}
╰─❒
`.trim();

    const fullMenu = `${header}\n\n${menuBody}\n\n${menuFooter}`;

    await conn.sendMessage(m.chat, {
      image: { url: img },
      caption: fullMenu,
      mentions: [m.sender]
    }, { quoted: menuMsg });

  } catch (e) {
    await conn.reply(m.chat, `⚠️ Ocurrió un error al mostrar el menú.\n> ${e.message}`, m);
  }
};

handler.command = ['menu', 'help', 'menú'];
export default handler;
