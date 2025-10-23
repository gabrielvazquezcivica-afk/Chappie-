// Estado de bienvenida por grupo
const estadoWelcome = new Map()

export default {
  nombre: 'welcome',
  ejecutar: async (sock, sender, mensaje) => {
    const grupo = mensaje.key.remoteJid

    // Activar o desactivar la bienvenida
    const texto = mensaje.message?.conversation || mensaje.message?.extendedTextMessage?.text || ''
    if (texto.toLowerCase().includes('on')) {
      estadoWelcome.set(grupo, true)
      await sock.sendMessage(grupo, { text: '✅ Bienvenida activada para este grupo.' })
    } else if (texto.toLowerCase().includes('off')) {
      estadoWelcome.set(grupo, false)
      await sock.sendMessage(grupo, { text: '❌ Bienvenida desactivada para este grupo.' })
    } else {
      await sock.sendMessage(grupo, { text: 'Escribe ".welcome on" para activar o ".welcome off" para desactivar la bienvenida.' })
    }
  },

  // Función para usar en group-participants.update
  welcomeListener: async (sock, update) => {
    if (update.action !== 'add') return

    const grupo = update.jid || update.id || update.remoteJid
    if (!estadoWelcome.get(grupo)) return // Solo si la bienvenida está activa

    for (const userId of update.participants) {
      try {
        let fotoUrl
        try {
          fotoUrl = await sock.profilePictureUrl(userId, 'image')
        } catch {
          fotoUrl = null
        }

        const nombre = userId.split('@')[0]
        const mensajeBienvenida = `👋 Bienvenido al grupo, ${nombre}!`

        if (fotoUrl) {
          await sock.sendMessage(grupo, {
            image: { url: fotoUrl },
            caption: mensajeBienvenida
          })
        } else {
          await sock.sendMessage(grupo, { text: mensajeBienvenida })
        }
      } catch (e) {
        console.log(`❌ Error enviando bienvenida a ${userId}:`, e.message)
      }
    }
  }
}