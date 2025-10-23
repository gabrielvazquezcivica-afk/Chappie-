sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update
  if (connection === 'open') console.log('✅ Conectado a WhatsApp!')
  else if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (reason === 401 || reason === 405) {
      const phoneNumber = '521XXXXXXXXXX'
      const code = await sock.requestPairingCode(phoneNumber)
      console.log(`📲 Ingresa este código en tu WhatsApp: ${code}`)
    }
  } else if (qr) {
    console.log(`📸 QR generado (opcional): ${qr}`)
  }
})