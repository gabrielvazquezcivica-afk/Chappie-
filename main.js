// main.js — Control de conexión y comandos del bot

import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

// ===============================
// INICIO DEL BOT
// ===============================
export default async function startBot(options = { mode: 'qr' }) {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Chappie-Bot', 'Chrome', '2.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  // ===============================
  // CONEXIÓN Y MODO DE EMPAREJAMIENTO
  // ===============================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    if (connection === 'open') console.log('✅ Chappie-Bot conectado exitosamente!')

    if (options.mode === 'qr' && qr) {
      console.log('📸 Escanea este código QR con WhatsApp:')
      qrcode.generate(qr, { small: true })
    }

    if (options.mode === 'code' && connection === 'connecting') {
      console.log('🔑 Generando código de emparejamiento...')
      const number = '521XXXXXXXXXX' // ← tu número con código de país (ej. México)
      const code = await sock.requestPairingCode(number)
      console.log(`📲 Ingresa este código en WhatsApp: ${code}`)
    }

    if (connection === 'close') {
      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️ Sesión cerrada, elimina la carpeta /session y reconecta.')
      } else {
        console.log('🔁 Reconectando...')
        startBot(options)
      }
    }
  })

  // ===============================
  // CARGAR PLUGINS (./plugins)
  // ===============================
  const pluginsDir = './plugins'
  if (fs.existsSync(pluginsDir)) {
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
    for (const file of files) {
      try {
        const plugin = await import(`./plugins/${file}`)
        if (plugin.default) plugin.default(sock)
      } catch (err) {
        console.error(`❌ Error cargando plugin ${file}:`, err)
      }
    }
  }

  // ===============================
  // COMANDOS BÁSICOS
  // ===============================
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return

    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const prefix = '.'
    if (!text.startsWith(prefix)) return

    const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase()

    switch (command) {
      case 'ping':
        await sock.sendMessage(from, { text: '🏓 Pong! El bot está activo.' })
        break

      case 'menu':
        await sock.sendMessage(from, { text: '🧠 Comandos disponibles:\n.ping\n.menu\n.sticker\n.hola\n.adios' })
        break

      default:
        await sock.sendMessage(from, { text: `❓ Comando desconocido: ${command}` })
    }
  })

  // ===============================
  // BIENVENIDAS Y DESPEDIDAS EN GRUPOS
  // ===============================
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    for (const p of participants) {
      const name = p.split('@')[0]
      const msg = action === 'add' ? `🎉 ¡Bienvenido @${name}!` : `👋 ¡Adiós @${name}!`
      await sock.sendMessage(id, { text: msg, mentions: [p] })
    }
  })
}