// Estado de funciones por grupo
const estadoFunciones = new Map()

export default {
  nombre: 'enable',
  ejecutar: async (sock, sender, mensaje) => {
    const grupo = mensaje.key.remoteJid
    const texto = mensaje.message?.conversation || mensaje.message?.extendedTextMessage?.text || ''
    const args = texto.split(' ').slice(1) // lo que viene después de .enable

    if (args.length === 0) {
      return await sock.sendMessage(grupo, {
        text: '❌ Usa: .enable <funcion>\nEjemplo: .enable welcome'
      })
    }

    const funcion = args[0].toLowerCase()

    // Activar la función
    if (!estadoFunciones.has(grupo)) estadoFunciones.set(grupo, {})
    const grupoFuncs = estadoFunciones.get(grupo)
    grupoFuncs[funcion] = true
    estadoFunciones.set(grupo, grupoFuncs)

    await sock.sendMessage(grupo, {
      text: `✅ Función "${funcion}" activada para este grupo.`
    })
  },

  // Función para consultar si una función está habilitada
  isEnabled: (grupo, funcion) => {
    const grupoFuncs = estadoFunciones.get(grupo)
    return grupoFuncs?.[funcion] || false
  }
}