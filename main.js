import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import pino from 'pino'

async function startChappie() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // usamos pairing code
    browser: ['Chappie-Bot', 'Chrome', '2.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  // Manejo de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    if (connection === 'open') {
      console.log('✅ Chappie- conectado correctamente a WhatsApp!')
    } else if (connection === 'close') {
      if (reason === 401 || reason === 405) {
        console.log('⚠️ Sesión inválida. Generando nuevo código de emparejamiento...')
        const phoneNumber = '521XXXXXXXXXX' // tu número con código país
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`📲 Ingresa este código en tu WhatsApp: ${code}`)
      } else {
        console.log('🔁 Reconectando...')
        startChappie()
      }
    }
  })

  // Cargar plugins automáticamente
  const pluginsDir = './plugins'
  if (fs.existsSync(pluginsDir)) {
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
    for (const file of files) {
      import(`./plugins/${file}`).then(plugin => {
        if (plugin.default) plugin.default(sock)
        console.log(`🧩 Plugin cargado: ${file}`)
      }).catch(err => console.log(`⚠️ Error cargando plugin ${file}:`, err))
    }
  }

  // Escucha mensajes entrantes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const prefix = '.'

    if (!text.startsWith(prefix)) return
    const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase()

    switch (command) {
      case 'ping':
        await sock.sendMessage(from, { text: '🏓 Pong!' })
        break
      case 'sticker':
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        if (quoted?.imageMessage) {
          const buffer = await sock.downloadMediaMessage({ message: quoted })
          await sock.sendMessage(from, { sticker: buffer })
        } else {
          await sock.sendMessage(from, { text: '📸 Responde a una imagen con `.sticker` para crear un sticker.' })
        }
        break
      case 'menu':
        await sock.sendMessage(from, {
          text: `🧠 *Chappie- Bot*\n\nComandos disponibles:\n.ping\n.sticker\n.menu\n\nPrefijo actual: "."`
        })
        break
    }
  })

  // Detecta entrada/salida de participantes en grupos
  sock.ev.on('group-participants.update', async (event) => {
    const group = event.id
    for (const participant of event.participants) {
      if (event.action === 'add') {
        await sock.sendMessage(group, {
          text: `🎉 Bienvenido @${participant.split('@')[0]} al grupo!`,
          mentions: [participant]
        })
      } else if (event.action === 'remove') {
        await sock.sendMessage(group, {
          text: `👋 Adiós @${participant.split('@')[0]}, esperamos verte pronto.`,
          mentions: [participant]
        })
      }
    }
  })
}

startChappie()