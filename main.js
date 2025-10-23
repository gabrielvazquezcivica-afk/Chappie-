import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'

export async function startChappie(modo, numero) {
  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: modo === 'qr',
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada, razón: ${reason}`)
      if (reason !== DisconnectReason.loggedOut) {
        console.log('♻️  Reconectando...')
        startChappie(modo, numero)
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado correctamente a WhatsApp')
    } else if (connection === 'connecting') {
      console.log('🔌 Conectando...')
    }
  })

  if (modo === 'code') {
    console.log('🔑 Generando código de emparejamiento...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    try {
      const code = await sock.requestPairingCode(numero)
      console.log(`✅ Código de emparejamiento para ${numero}: ${code}`)
    } catch (err) {
      console.error('❌ Error al generar el código:', err.message)
    }
  }

  // 🧠 Ejemplo de comandos básicos
  sock.ev.on('messages.upsert', async (msg) => {
    const mensaje = msg.messages[0]
    if (!mensaje.message || mensaje.key.fromMe) return
    const texto = mensaje.message.conversation || mensaje.message.extendedTextMessage?.text || ''
    const sender = mensaje.key.remoteJid

    if (texto.startsWith('.hola')) {
      await sock.sendMessage(sender, { text: '👋 ¡Hola! Soy Chappie-Bot.' })
    }

    if (texto.startsWith('.sticker') && mensaje.message.imageMessage) {
      const buffer = await sock.downloadMediaMessage(mensaje)
      await sock.sendMessage(sender, { sticker: buffer })
    }
  })
}