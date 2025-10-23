import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'

export async function startChappie(modo, numero = 'N/A') {
  console.log('⚙️ Iniciando Chappie-Bot...')
  console.log(`📞 Número de referencia: ${numero}`)

  // Leer comandos existentes del repositorio
  const comandosPath = path.join('./commands')
  const comandos = new Map()

  if (fs.existsSync(comandosPath)) {
    const archivos = fs.readdirSync(comandosPath).filter(f => f.endsWith('.js'))
    for (const archivo of archivos) {
      const comandoModule = await import(`./commands/${archivo}`)
      const cmd = comandoModule.default
      if (cmd?.nombre && cmd?.ejecutar) {
        comandos.set(cmd.nombre.toLowerCase(), cmd)
        console.log(`🔹 Comando cargado: ${cmd.nombre}`)
      }
    }
  } else {
    console.log('⚠️ Carpeta commands/ no encontrada. No se cargarán comandos.')
  }

  // Conexión WhatsApp
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
      qrcode.generate(qr, { small: true }) // QR legible en Termux
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

  // Ejecutar comandos existentes
  sock.ev.on('messages.upsert', async (msg) => {
    const mensaje = msg.messages[0]
    if (!mensaje.message || mensaje.key.fromMe) return

    const texto = mensaje.message.conversation || mensaje.message.extendedTextMessage?.text || ''
    const sender = mensaje.key.remoteJid
    const prefijo = '.'

    if (!texto.startsWith(prefijo)) return

    const nombreComando = texto.slice(prefijo.length).split(' ')[0].toLowerCase()
    const cmd = comandos.get(nombreComando)
    if (cmd) {
      try {
        await cmd.ejecutar(sock, sender, mensaje)
      } catch (e) {
        console.log(`❌ Error ejecutando comando ${nombreComando}:`, e)
      }
    } else {
      await sock.sendMessage(sender, { text: '❌ Comando no reconocido.' })
    }
  })
}