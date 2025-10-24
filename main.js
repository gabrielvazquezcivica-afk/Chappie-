// main.js — Chappie-Bot 💬
// Hecho para funcionar con ES Modules ("type": "module")

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

// Compatibilidad con rutas
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 📦 Carpeta donde están tus plugins
const PLUGINS_DIR = path.join(__dirname, 'plugins')
const ALMACENAMIENTO_DIR = path.join(__dirname, 'almacenamiento')

// ✅ Cargar automáticamente los plugins
export async function cargarPlugins() {
  const comandos = []

  async function cargarDesde(dir) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Carpeta ${dir} no encontrada.`)
      return
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
    for (const file of files) {
      try {
        const filePath = path.join(dir, file)
        const plugin = await import(`file://${filePath}`)

        if (plugin.default || plugin.handler) {
          comandos.push(plugin.default || plugin.handler)
        }

        const comando = plugin.name || file.replace('.js', '')
        console.log(`⚙️ Archivo ${file} cargado correctamente`)
      } catch (err) {
        console.error(`❌ Error cargando ${file}:`, err.message)
      }
    }
  }

  await cargarDesde(PLUGINS_DIR)
  await cargarDesde(ALMACENAMIENTO_DIR)

  console.log(`📦 Total comandos cargados: ${comandos.length}`)
  return comandos
}

// 🧠 Función principal del bot
export async function startChappie() {
  console.clear()
  console.log('==============================')
  console.log('🤖 Iniciando Chappie-Bot...')
  console.log('==============================')

  // 1️⃣ Cargar plugins
  await cargarPlugins()

  // 2️⃣ Autenticación con Baileys
  const { state, saveCreds } = await useMultiFileAuthState('./ChappieSession')

  // 3️⃣ Crear socket
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    browser: ['Chappie-Bot', 'Safari', '1.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  // 4️⃣ Leer mensajes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      ''
    const sender = msg.key.participant || msg.key.remoteJid

    if (body.startsWith('.')) {
      const command = body.slice(1).trim().split(' ')[0].toLowerCase()
      console.log(`🧩 Comando recibido: ${command} de ${sender}`)
      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Comando recibido: *${command}*`,
      })
    }
  })

  console.log('🔌 Conectando a WhatsApp...')
  console.log('✅ Conectado a WhatsApp')
}

// Ejecutar automáticamente si se ejecuta este archivo directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startChappie()
}