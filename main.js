import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

// 🧠 Cargar automáticamente todos los archivos .js dentro de las carpetas especificadas
async function cargarPlugins() {
  const comandos = new Map()
  const carpetas = ['plugins', 'almacenamiento']

  for (const carpeta of carpetas) {
    const dir = path.resolve(`./${carpeta}`)
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Carpeta ${carpeta} no encontrada.`)
      continue
    }

    const archivos = fs.readdirSync(dir).filter(a => a.endsWith('.js'))
    for (const archivo of archivos) {
      try {
        const ruta = path.join(dir, archivo)
        const mod = await import(`file://${ruta}`)
        const cmd = mod.default || mod
        if (cmd?.nombre && typeof cmd?.ejecutar === 'function') {
          comandos.set(cmd.nombre.toLowerCase(), cmd)
          console.log(`✅ Comando cargado: ${cmd.nombre} (${carpeta}/${archivo})`)
        } else {
          console.log(`⚙️ Archivo ${archivo} cargado (sin comando directo)`)
        }
      } catch (err) {
        console.log(`❌ Error cargando ${archivo}: ${err.message}`)
      }
    }
  }

  console.log(`📦 Total comandos cargados: ${comandos.size}`)
  return comandos
}

// 🚀 Inicia el bot
export async function startChappie() {
  console.clear()
  console.log('===============================')
  console.log('🤖 Iniciando Chappie-Bot...')
  console.log('===============================')

  const comandos = await cargarPlugins()
  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // muestra el QR pequeño
    logger: pino({ level: 'silent' }),
    browser: ['ChappieBot', 'Chrome', '10.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (connection === 'open') console.log('✅ Conectado a WhatsApp')
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada (${reason})`)
      if (reason !== DisconnectReason.loggedOut) startChappie()
    }
  })

  // 📩 Leer mensajes
  sock.ev.on('messages.upsert', async (msg) => {
    const m = msg.messages[0]
    if (!m.message || m.key.fromMe) return

    const texto = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!texto.startsWith('.')) return

    const [nombreCmd, ...args] = texto.slice(1).trim().split(/\s+/)
    const comando = comandos.get(nombreCmd.toLowerCase())

    if (!comando) {
      console.log(`❓ Comando no encontrado: ${nombreCmd}`)
      return
    }

    try {
      console.log(`⚡ Ejecutando comando: ${comando.nombre}`)
      await comando.ejecutar(sock, m, args)
    } catch (err) {
      console.error(`❌ Error ejecutando ${nombreCmd}:`, err)
    }
  })
}