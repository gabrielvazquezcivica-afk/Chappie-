import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'

export async function startChappie(modo, numero) {
  console.log('⚙️ Iniciando conexión con WhatsApp...')

  // Carga o crea el estado de autenticación
  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: modo === 'qr',
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  sock.ev.on('creds.update', saveCreds)

  let conectado = false

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'connecting') {
      console.log('🔌 Conectando a los servidores de WhatsApp...')
    } else if (connection === 'open') {
      console.log('✅ Conectado correctamente a WhatsApp')
      conectado = true
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada (razón: ${reason})`)
      if (reason !== DisconnectReason.loggedOut) {
        console.log('♻️ Intentando reconectar...')
        startChappie(modo, numero)
      }
    }
  })

  // 🕓 Esperar hasta que el socket esté listo antes de emparejar
  if (modo === 'code') {
    console.log('🔑 Esperando conexión estable antes de generar el código...')
    let intentos = 0
    while (!conectado && intentos < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      intentos++
    }

    if (!conectado) {
      console.log('⚠️ No se logró conectar. Intenta nuevamente más tarde.')
      process.exit(1)
    }

    try {
      console.log('🔑 Generando código de emparejamiento...')
      const code = await sock.requestPairingCode(numero)
      console.log(`✅ Código de emparejamiento para ${numero}: ${code}`)
      console.log('📲 Usa este código en WhatsApp Web (en la sección "Vincular con código")')
    } catch (err) {
      console.error('❌ Error al generar el código:', err.message)
    }
  }

  // 🧠 Escucha mensajes y responde a comandos
  sock.ev.on('messages.upsert', async (msg) => {
    const mensaje = msg.messages[0]
    if (!mensaje.message || mensaje.key.fromMe) return
    const texto = mensaje.message.conversation || mensaje.message.extendedTextMessage?.text || ''
    const sender = mensaje.key.remoteJid

    // Comando .hola
    if (texto.startsWith('.hola')) {
      await sock.sendMessage(sender, { text: '👋 ¡Hola! Soy Chappie-Bot, listo para ayudarte.' })
    }

    // Comando .sticker (convierte imagen a sticker)
    if (texto.startsWith('.sticker') && mensaje.message.imageMessage) {
      const buffer = await sock.downloadMediaMessage(mensaje)
      await sock.sendMessage(sender, { sticker: buffer })
    }

    // Comando .menu
    if (texto.startsWith('.menu')) {
      const menu = `
🧠 *Chappie-Bot Comandos:*
. hola – Saludo
. sticker – Convierte imagen en sticker
. menu – Muestra este menú
`
      await sock.sendMessage(sender, { text: menu })
    }
  })
}