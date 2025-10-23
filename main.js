import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import path from 'path'

// ----------------------------
// Función para cargar plugins automáticamente
// ----------------------------
async function cargarPlugins() {
  const comandos = new Map()
  const pluginsDir = path.join('./', 'plugins')

  if (!fs.existsSync(pluginsDir)) {
    console.log('⚠️ Carpeta plugins no encontrada.')
    return comandos
  }

  const archivos = fs.readdirSync(pluginsDir)

  for (const archivo of archivos) {
    const rutaArchivo = path.join(pluginsDir, archivo)
    if (fs.statSync(rutaArchivo).isFile() && archivo.endsWith('.js')) {
      try {
        const modulo = await import(path.resolve(rutaArchivo))
        const cmd = modulo.default
        if (cmd?.nombre && cmd?.ejecutar) {
          comandos.set(cmd.nombre.toLowerCase(), cmd)
          console.log(`✅ Plugin cargado: ${cmd.nombre}`)
        } else {
          console.log(`⚠️ Plugin ${archivo} no tiene 'nombre' o 'ejecutar', se omite.`)
        }
      } catch (e) {
        console.log(`❌ Error cargando plugin ${archivo}:`, e.message)
      }
    }
  }

  console.log(`📂 Total de plugins cargados: ${comandos.size}`)
  return comandos
}

// ----------------------------
// Función principal del bot
// ----------------------------
export async function startChappie() {
  console.clear()
  console.log('⚙️ Iniciando Chappie-Bot (sin comandos internos)...')

  // Cargar plugins
  const comandos = await cargarPlugins()

  // Conexión WhatsApp
  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea este QR con WhatsApp:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'connecting') console.log('🔌 Conectando a WhatsApp...')
    else if (connection === 'open') console.log('✅ Conectado a WhatsApp')
    else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`❌ Conexión cerrada (razón: ${reason})`)
      if (reason !== DisconnectReason.loggedOut) startChappie()
    }
  })

  // Escuchar mensajes y ejecutar plugins
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
      console.log(`⚡ Ejecutando plugin: ${cmd.nombre} desde ${sender}`)
      try {
        await cmd.ejecutar(sock, sender, mensaje)
      } catch (e) {
        console.log(`❌ Error ejecutando plugin ${nombreComando}:`, e)
      }
    } else {
      console.log(`❌ Comando/plugin no reconocido: ${nombreComando}`)
    }
  })
}