import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'

// Función recursiva para leer todos los archivos JS en carpetas
async function cargarComandosRecursivo(dir, comandos) {
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const itemPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      await cargarComandosRecursivo(itemPath, comandos) // recursivo
    } else if (item.isFile() && item.name.endsWith('.js') && item.name !== 'main.js' && item.name !== 'index.js') {
      try {
        const cmdModule = await import(itemPath)
        const cmd = cmdModule.default
        if (cmd?.nombre && cmd?.ejecutar) {
          comandos.set(cmd.nombre.toLowerCase(), cmd)
          console.log(`🔹 Comando cargado: ${cmd.nombre} desde ${itemPath}`)
        } else {
          console.log(`⚠️ Archivo ${itemPath} no tiene comando válido`)
        }
      } catch (e) {
        console.log(`❌ Error cargando ${itemPath}:`, e)
      }
    }
  }
}

export async function startChappie(modo, numero = 'N/A') {
  console.clear()
  console.log('⚙️ Iniciando Chappie-Bot...')
  console.log(`📞 Número de referencia: ${numero}`)

  // ----------------------------
  // CARGAR TODOS LOS COMANDOS RECURSIVAMENTE
  // ----------------------------
  const repoPath = path.resolve('./') // raíz del repositorio
  const comandos = new Map()
  await cargarComandosRecursivo(repoPath, comandos)
  console.log(`✅ Total de comandos cargados: ${comandos.size}`)

  // ----------------------------
  // CONEXIÓN WHATSAPP
  // ----------------------------
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
      qrcode.generate(qr, { small: true }) // QR compacto
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

  // ----------------------------
  // EJECUTAR COMANDOS
  // ----------------------------
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
      console.log(`⚡ Ejecutando comando: ${cmd.nombre} desde ${sender}`)
      try {
        await cmd.ejecutar(sock, sender, mensaje)
      } catch (e) {
        console.log(`❌ Error ejecutando comando ${nombreComando}:`, e)
      }
    } else {
      console.log(`❌ Comando no reconocido: ${nombreComando}`)
      await sock.sendMessage(sender, { text: '❌ Comando no reconocido.' })
    }
  })
}