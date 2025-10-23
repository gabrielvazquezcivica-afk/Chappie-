export default {
  nombre: 'welcome',
  ejecutar: async (sock, sender, mensaje, plugins) => {
    // Solo responde a comandos .welcome para activarlo o desactivarlo
    const texto = mensaje.message?.conversation || mensaje.message?.extendedTextMessage?.text || ''
    if (!texto.toLowerCase().startsWith('.welcome')) return

    const args = texto.split(' ').slice(1)
    const grupo = mensaje.key.remoteJid
    const pluginEnable = plugins.get('enable')

    if (!pluginEnable) {
      return await sock.sendMessage(grupo, { text: '❌ Plugin enable no encontrado.' })
    }

    if (args[0] && args[0].toLowerCase() === 'on') {
      pluginEnable.isEnabled(grupo, 'welcome') // marcar como activado
      await sock.sendMessage(grupo, { text: '✅ Bienvenida activada para este grupo.' })
    } else if (args[0] && args[0].toLowerCase() === 'off') {
      pluginEnable.isEnabled(grupo, 'welcome', false) // marcar como desactivado
      await sock.sendMessage(grupo, { text: '❌ Bienvenida desactivada para este grupo.' })
    } else {
      await sock.sendMessage(grupo, { text: 'Escribe ".welcome on" para activar o ".welcome off" para desactivar la bienvenida.' })
    }
  },

  // Listener automático para detectar nuevos participantes
  welcomeListener: async (sock, update, plugins) => {
    if (update.action !== 'add') return
    const grupo = update.jid || update.remoteJid
    const pluginEnable = plugins.get('enable')
    if (!pluginEnable?.isEnabled(grupo, 'welcome')) return // solo si está activado

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