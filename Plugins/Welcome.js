export default {
  nombre: 'welcome',
  ejecutar: async (sock, sender, mensaje) => {
    try {
      const grupo = mensaje.key.remoteJid

      // Obtener metadata del grupo
      const grupoInfo = await sock.groupMetadata(grupo)
      const participantes = grupoInfo.participants

      // Detectar usuarios nuevos
      const nuevos = participantes.filter(p => p.id === mensaje.key.participant)

      if (nuevos.length === 0) return

      for (const user of nuevos) {
        try {
          // Obtener foto de perfil del usuario
          let fotoUrl
          try {
            fotoUrl = await sock.profilePictureUrl(user.id, 'image')
          } catch {
            fotoUrl = null
          }

          const nombre = user.notify || user.id.split('@')[0]

          // Enviar mensaje de bienvenida
          const mensajeBienvenida = {
            text: `👋 Bienvenido al grupo, ${nombre}!`,
          }

          if (fotoUrl) {
            // Enviar foto con mensaje
            await sock.sendMessage(grupo, {
              image: { url: fotoUrl },
              caption: mensajeBienvenida.text
            })
          } else {
            // Solo texto si no hay foto
            await sock.sendMessage(grupo, mensajeBienvenida)
          }
        } catch (e) {
          console.log(`❌ Error enviando bienvenida a ${user.id}:`, e.message)
        }
      }
    } catch (err) {
      console.log('❌ Error en plugin welcome:', err.message)
    }
  }
}
