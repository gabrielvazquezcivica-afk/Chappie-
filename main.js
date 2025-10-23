// main.js — Conexión, comandos y plugins
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import pino from 'pino'

export default async function startChappie() {
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

  // Manejo de conexión y pairing code
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    if (connection === 'open') console.log('✅ Chappie- conectado a WhatsApp!')
    else if (connection === 'close') {
      if (reason === 401 || reason === 405) {
        console.log('⚠️ Sesión inválida, generando código de emparejamiento...')
        const phoneNumber = '521XXXXXXXXXX' // <- tu número con código de país
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`📲 Ingresa este código en WhatsApp: ${code}`)
      } else {
        console.log('🔁 Reconectando...')
        startChappie()
      }
    }
  })

  // Cargar plugins automáticamente
  const pluginsDir = './plugins'
  if (fs.existsSync(pluginsDir)) {
    for (const file of fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))) {
      import(`./plugins/${file}`).then(p => p.default?.(sock))
    }
  }

  // Comandos básicos
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return

    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const prefix = '.'
    if (!text.startsWith(prefix)) return

    const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase()

    switch (command) {
      case 'ping': await sock.sendMessage(from, { text: '🏓 Pong!' }); break
      case 'menu': await sock.sendMessage(from, { text: '🧠 Comandos disponibles:\n.ping\n.menu\n.sticker\n.hola\n.adios' }); break
    }
  })

  // Detecta entrada/salida en grupos
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    for (const p of participants) {
      const name = p.split('@')[0]
      const text = action === 'add' ? `🎉 Bienvenido @${name}!` : `👋 Adiós @${name}!`
      await sock.sendMessage(id, { text, mentions: [p] })
    }
  })
}