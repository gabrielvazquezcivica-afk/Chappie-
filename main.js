// main.js
import { join, resolve, extname } from 'path'
import { readdirSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

// Carpeta(s) donde están los comandos/plugin
const pluginDirs = [
  join(__dirname, 'plugins'),
  join(__dirname, 'almacenamiento')
]

async function loadPlugins() {
  const commands = new Map()
  for (const dir of pluginDirs) {
    try {
      const files = readdirSync(dir)
      for (const file of files) {
        const full = join(dir, file)
        if (statSync(full).isFile() && extname(full) === '.js') {
          try {
            const module = await import(`file://${full}`)
            const cmd = module.default || module
            if (cmd && cmd.nombre && typeof cmd.ejecutar === 'function') {
              commands.set(cmd.nombre.toLowerCase(), cmd)
              console.log(`✅ Comando cargado: ${cmd.nombre} (${dir}/${file})`)
            } else {
              console.log(`⚠️ Archivo cargado sin comando válido: ${dir}/${file}`)
            }
          } catch (e) {
            console.log(`❌ Error cargando archivo ${dir}/${file}: ${e.message}`)
          }
        }
      }
    } catch {
      console.log(`⚠️ Carpeta no encontrada o sin acceso: ${dir}`)
    }
  }
  console.log(`📦 Total de comandos cargados: ${commands.size}`)
  return commands
}

export async function startChappie() {
  console.clear()
  console.log('===============================')
  console.log('🤖 Iniciando Chappie-Bot...')
  console.log('===============================')

  const commands = await loadPlugins()
  const { state, saveCreds } = await useMultiFileAuthState(join(__dirname, 'ChappieSession'))

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['ChappieBot', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log('📲 Escanea este QR:')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp')
    }
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada (razón: ${reason})`)
      if (reason !== DisconnectReason.loggedOut) {
        startChappie()
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const text = m.message.conversation ||
                 m.message.extendedTextMessage?.text ||
                 ''
    if (!text.startsWith('.')) return

    const [cmdName, ...args] = text.slice(1).trim().split(/\s+/)
    const cmd = commands.get(cmdName.toLowerCase())
    if (!cmd) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Comando no reconocido: ${cmdName}` })
      return
    }
    try {
      console.log(`⚡ Ejecutando comando: ${cmd.nombre}`)
      await cmd.ejecutar(sock, m, args)
    } catch (err) {
      console.error(`❌ Error ejecutando ${cmdName}:`, err)
    }
  })
}