export default async function startChappie(options = { useQRCode: true }) {
  const { useQRCode } = options
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()
  const qrcode = await import('qrcode-terminal')

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // siempre false, manejaremos manualmente
    browser: ['Chappie-Bot', 'Chrome', '2.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    if (connection === 'open') console.log('✅ Conectado a WhatsApp!')

    // Mostrar QR solo si opción QR está activa
    if (useQRCode && qr) {
      qrcode.generate(qr, { small: true })
    }

    if (!useQRCode && connection === 'connecting') {
      console.log('🔑 Ingresa tu CodeBot / pairing code en WhatsApp')
    }

    if (connection === 'close') {
      if (reason === 401 || reason === 405) {
        console.log('⚠️ Sesión inválida, reinicia e ingresa el QR o CodeBot')
      } else {
        console.log('🔁 Reconectando...')
        startChappie(options)
      }
    }
  })

  // Aquí sigue todo el resto del código de comandos, plugins, grupos...
}