const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = import('@whiskeysockets/baileys')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        auth: state,
        version
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            let message = ''
            if (update.subject) {
                message += `🔄 El nombre del grupo ha cambiado a *${update.subject}*.\n`
            }
            if (update.icon !== undefined) {
                message += '🖼️ La foto del grupo ha cambiado.\n'
            }
            if (message) {
                // Notifica al grupo del cambio y quién lo hizo (si hay información)
                const actor = update.author ? `por @${update.author.split('@')[0]}` : ''
                await sock.sendMessage(update.id, { text: message + (actor ? `Cambio hecho ${actor}` : '') })
            }
        }
    })

    sock.ev.on('group-participants.update', async (update) => {
        // Detectar cambios de admin
        for (const participant of update.participants) {
            if (update.action === 'promote') {
                await sock.sendMessage(update.id, { text: `🛡️ @${participant.split('@')[0]} ahora es administrador. Cambio hecho por @${update.author?.split('@')[0] || "Desconocido"}` })
            } else if (update.action === 'demote') {
                await sock.sendMessage(update.id, { text: `⚠️ @${participant.split('@')[0]} ya no es administrador. Cambio hecho por @${update.author?.split('@')[0] || "Desconocido"}` })
            }
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('Bot conectado exitosamente')
        }
    })
}

startBot()