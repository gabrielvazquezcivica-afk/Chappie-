import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'

export async function startChappie(modo, numero = 'N/A') {
  console.log('⚙️ Iniciando conexión con WhatsApp...')
  console.log(`📞 Número de referencia: ${numero}`)

  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // lo mostraremos con qrcode-terminal
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea este QR con WhatsApp:')
      qrcode.generate(qr, { small: false })
    }

    if (connection === 'connecting') console.log('🔌 Conectando a WhatsApp...')
    else if (connection === 'open') console.log('✅ Conectado correctamente a WhatsApp')
    else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada (razón: ${reason})`)
      if (reason !== DisconnectReason.loggedOut) {
        console.log('♻️ Reconectando...')
        startChappie(modo, numero)
      }
    }
  })

  // Comandos básicos con prefijo '.'
  sock.ev.on('messages.upsert', async (msg) => {
    const mensaje = msg.messages[0]
    if (!mensaje.message || mensaje.key.fromMe) return

    const texto = mensaje.message.conversation || mensaje.message.extendedTextMessage?.text || ''
    const sender = mensaje.key.remoteJid
    const isGroup = sender.endsWith('@g.us')
    const prefijo = '.'

    if (!texto.startsWith(prefijo)) return

    const comando = texto.slice(prefijo.length).split(' ')[0].toLowerCase()

    switch (comando) {
      case 'hola':
        await sock.sendMessage(sender, { text: `👋 ¡Hola! Soy Chappie-Bot.` })
        break
      case 'ping':
        await sock.sendMessage(sender, { text: '🏓 Pong!' })
        break
      case 'sticker':
        if (mensaje.message.imageMessage) {
          const buffer = await sock.downloadMediaMessage(mensaje)
          await sock.sendMessage(sender, { sticker: buffer })
        } else {
          await sock.sendMessage(sender, { text: '❌ Envía una imagen con .sticker' })
        }
        break
      case 'menu':
        let menu = '🧠 *Chappie-Bot Comandos:*\n'
        menu += '.hola – Saludo\n'
        menu += '.ping – Respuesta rápida\n'
        menu += '.sticker – Imagen a sticker\n'
        menu += '.menu – Mostrar este menú\n'
        menu += `📌 Responde en ${isGroup ? 'grupo' : 'chat privado'}`
        await sock.sendMessage(sender, { text: menu })
        break
      default:
        await sock.sendMessage(sender, { text: '❌ Comando no reconocido. Usa .menu' })
    }
  })
}