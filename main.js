const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')

async function startBot() {
    // Autenticación basada en archivos
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    // Evento: Mensaje entrante
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        // Responde al mensaje recibido
        if (text) {
            await sock.sendMessage(from, { text: '¡Hola! Recibí tu mensaje: ' + text })
        }
    })

    // Evento: Guardar credenciales cuando cambian
    sock.ev.on('creds.update', saveCreds)

    // Evento: Reconexión automática
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot()
            } else {
                console.log('Se cerró la sesión. Por favor, elimine la carpeta auth_info y vuelva a iniciar.')
            }
        }
    })
}

startBot()
