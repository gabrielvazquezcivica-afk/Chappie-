// Menú principal por categorías y comandos, con respuestas automáticas

const mainMenu = ({ timeFt, sender, Bot, groupName }) => ({
  header: `🍄 𝐌𝐄𝐍𝐔 - 𝐏𝐑𝐈𝐍𝐂𝐈𝐏𝐀𝐋 🍄
╭══════════════════
│❐   ➢ ${timeFt}
❱🙋🏻‍♂️ @${sender.split('@')[0]}
│🤖  ꦿ𝐒𝐎𝐘 : ${Bot}
│⚡  ꦿ𝙋𝙍𝙀𝙁𝙄𝙅𝙊 : 𝐌𝐮𝐥𝐭𝐢𝐩𝐫𝐞𝐟𝐢𝐣𝐨
│🆎  ꦿ𝙂𝙍𝙐𝙋𝙊 : ${groupName}
│╰───────────────❍
╰━━━━━─「✪」─━━━━━
✪ 🚀 𝙇𝙄𝙎𝙏𝘼 𝘿𝙀 𝘾𝙊𝙈𝘼𝙉𝘋𝙊𝙎 🚀
  ━━━━━─「✪」─━━━━━

❌ 𝐒𝐈𝐍 𝐀𝐏𝐈 ❌
`,
  categories: [
    {
      name: "🕴🏻 𝐌𝐄𝐍𝐔 𝐀𝐃𝐌𝐈𝐍 🕴🏻",
      commands: [
        { name: "welcome 1/0", reply: "Activa o desactiva la bienvenida al grupo." },
        { name: "Antilink 1/0", reply: "Activa o desactiva el bloqueo de enlaces." },
        { name: "todos", reply: "Menciona a todos los miembros del grupo." },
        { name: "anuncio", reply: "Envía un anuncio al grupo." },
        { name: "cerrar/abrir", reply: "Cierra o abre el grupo para mensajes." },
        { name: "kick", reply: "Expulsa a un miembro del grupo." },
        { name: "n", reply: "Comando especial para administración." },
        { name: "rankrep", reply: "Muestra el ranking de reputación." },
        { name: "rankcoins", reply: "Muestra el ranking de monedas." },
        { name: "ranknivel", reply: "Muestra el ranking de niveles." },
        { name: "Daradmin", reply: "Otorga permisos de administrador." },
        { name: "Demote", reply: "Revoca permisos de administrador." },
        { name: "Del", reply: "Elimina mensajes." },
        { name: "ruletaban", reply: "Juega la ruleta para banear." },
        { name: "kicknum <prefijo>", reply: "Expulsa a varios usuarios por prefijo." },
        { name: "Admins <mensaje>", reply: "Menciona a los admins con tu mensaje." },
        { name: "groupname <nombre>", reply: "Cambia el nombre del grupo." },
        { name: "link", reply: "Obtiene el link del grupo." },
        { name: "resetlink", reply: "Resetea el link del grupo." }
      ]
    },
    {
      name: "👨🏻‍💻 𝐌𝐄𝐍𝐔 𝐂𝐑𝐄𝐀𝐃𝐎𝐑 👨🏻‍💻",
      commands: [
        { name: "antiprivado", reply: "Bloquea mensajes privados." },
        { name: "revelarvisu", reply: "Revela usuarios que solo ven el grupo." },
        { name: "reiniciar", reply: "Reinicia el bot." },
        { name: "bangp", reply: "Banea por privado." },
        { name: "unbangp", reply: "Desbanea por privado." },
        { name: "kickall", reply: "Expulsa a todos los usuarios del grupo." }
      ]
    },
    {
      name: "🏷️ 𝐌𝐄𝐍𝐔 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒 🏷️",
      commands: [
        { name: "play", reply: "Descarga música (sin API temporalmente)." },
        { name: "playvideo", reply: "Descarga videos (sin API temporalmente)." },
        { name: "tiktokvideo", reply: "Descarga videos de TikTok (sin API temporalmente)." },
        { name: "tiktokaudio", reply: "Descarga audios de TikTok (sin API temporalmente)." },
        { name: "buscarapk", reply: "Busca APKs (sin API temporalmente)." },
        { name: "descargarapk", reply: "Descarga APKs (sin API temporalmente)." }
      ]
    },
    {
      name: "👽 𝐌𝐄𝐍𝐔 𝐈𝐍𝐅𝐎 👽",
      commands: [
        { name: "ping", reply: "Mide la velocidad de respuesta del bot." },
        { name: "perfil", reply: "Muestra tu perfil." },
        { name: "serbot", reply: "Convierte este chat en bot temporal." }
      ]
    },
    {
      name: "🕹️ 𝐌𝐄𝐍𝐔 𝐅𝐈𝐆𝐔𝐒 🕹️",
      commands: [
        { name: "sticker", reply: "Crea stickers." },
        { name: "attp", reply: "Crea sticker de texto (sin API)." },
        { name: "attp2", reply: "Crea sticker de texto 2 (sin API)." },
        { name: "attp3", reply: "Crea sticker de texto 3 (sin API)." },
        { name: "Emojimix", reply: "Combina emojis en stickers." }
      ]
    },
    {
      name: "⚙️ 𝐌𝐄𝐍𝐔 𝐇𝐄𝐑𝐑𝐀𝐌𝐈𝐄𝐍𝐓𝐀𝐒 ⚙️",
      commands: [
        { name: "toimg", reply: "Convierte sticker a imagen." },
        { name: "tomp3", reply: "Convierte video a MP3." },
        { name: "calcular", reply: "Resuelve operaciones matemáticas." },
        { name: "nick", reply: "Genera nicknames (sin API)." },
        { name: "ia", reply: "Acceso a inteligencia artificial (sin API)." },
        { name: "chatgpt", reply: "Consulta a ChatGPT (sin API)." }
      ]
    },
    {
      name: "💰 𝐌𝐄𝐍𝐔 - 𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀 💰",
      commands: [
        { name: "Nivel", reply: "Consulta tu nivel." },
        { name: "cartera", reply: "Consulta tu cartera." },
        { name: "listreg", reply: "Lista de registros." },
        { name: "ruleta", reply: "Juega la ruleta." },
        { name: "levelup", reply: "Sube de nivel." },
        { name: "minar", reply: "Mina monedas." },
        { name: "regalar", reply: "Regala monedas." },
        { name: "mireputacion", reply: "Consulta tu reputación." },
        { name: "tragamonedas", reply: "Juega a las tragamonedas." },
        { name: "dayli", reply: "Reclama recompensa diaria." },
        { name: "pescar", reply: "Juega a pescar." },
        { name: "tienda", reply: "Consulta la tienda." }
      ]
    },
    {
      name: "🎮 𝐌𝐄𝐍𝐔 - 𝐉𝐔𝐄𝐆𝐎𝐒 🎮",
      commands: [
        { name: "casar", reply: "Cásate con otro usuario." },
        { name: "follar", reply: "Comando divertido de juego." },
        { name: "gay", reply: "Juega la ruleta gay." },
        { name: "toppareja", reply: "Muestra la mejor pareja." },
        { name: "topparejas5", reply: "Muestra el top 5 de parejas." },
        { name: "top <texto>", reply: "Muestra el top personalizado." },
        { name: "lesbiana", reply: "Juega la ruleta lesbiana." }
      ]
    }
  ],
  footer: `
𝑮𝑹𝑨𝑪𝑰𝑨𝑺 𝑷𝑶𝑹 𝑷𝑹𝑬𝑭𝑬𝑹𝑰𝑹
*𝙸𝚃𝙰𝙲𝙷𝙸 - 𝙱𝙾𝚃*`
});

module.exports = mainMenu;
