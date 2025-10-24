import fs from 'fs';
import path from 'path';

export default (chappie, chalk) => {
    const enabledFile = path.join('./plugins', 'enabled.json');

    if (!fs.existsSync(enabledFile)) {
        fs.writeFileSync(enabledFile, JSON.stringify({}));
    }

    const getEnabled = () => JSON.parse(fs.readFileSync(enabledFile, 'utf-8'));
    const saveEnabled = (data) => fs.writeFileSync(enabledFile, JSON.stringify(data, null, 2));

    const validCommands = ['welcome','modoadmin','antiarabes','antiprivado'];

    chappie.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;

        // Obtener texto del mensaje, sin importar si es respuesta o media
        let content = '';
        if (msg.message.conversation) content = msg.message.conversation;
        else if (msg.message.extendedTextMessage?.text) content = msg.message.extendedTextMessage.text;
        else if (msg.message.imageMessage?.caption) content = msg.message.imageMessage.caption;
        else if (msg.message.videoMessage?.caption) content = msg.message.videoMessage.caption;
        else if (msg.message.documentMessage?.caption) content = msg.message.documentMessage.caption;

        if (!content) return;
        content = content.trim();

        if (!content.startsWith('.enable') && !content.startsWith('.disable')) return;

        // Verificar admin
        const groupMetadata = await chappie.groupMetadata(from).catch(() => null);
        const admins = groupMetadata?.participants?.filter(p => p.admin)?.map(a => a.id) || [];
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!admins.includes(sender)) {
            await chappie.sendMessage(from, { text: '❌ Solo administradores pueden usar este comando.' });
            return;
        }

        const args = content.split(' ');
        const action = args[0].replace('.', '');
        const cmdName = args[1];

        if (!cmdName || !validCommands.includes(cmdName)) {
            await chappie.sendMessage(from, { text: '❌ Comando inválido. Comandos válidos:\n' + validCommands.join(', ') });
            return;
        }

        const enabled = getEnabled();
        if (!enabled[from]) enabled[from] = {};

        if (action === 'enable') {
            enabled[from][cmdName] = true;
            await chappie.sendMessage(from, { text: `✅ Comando ${cmdName} habilitado correctamente.` });
            console.log(chalk.green('[✔ Comando habilitado]'), chalk.blue(cmdName), 'en grupo', chalk.magenta(from));
        } else {
            enabled[from][cmdName] = false;
            await chappie.sendMessage(from, { text: `❌ Comando ${cmdName} deshabilitado correctamente.` });
            console.log(chalk.red('[✖ Comando deshabilitado]'), chalk.blue(cmdName), 'en grupo', chalk.magenta(from));
        }

        saveEnabled(enabled);
    });

    // Función global para verificar si un comando está habilitado
    chappie.isEnabled = (groupId, command) => {
        const enabled = getEnabled();
        return enabled[groupId]?.[command] !== false; // por defecto true
    };
};