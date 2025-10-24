import fs from 'fs';
import path from 'path';

export default (chappie, chalk) => {

    // Archivo donde se guardarán los comandos habilitados/deshabilitados
    const enabledFile = path.join('./plugins', 'enabled.json');

    // Inicializamos el JSON si no existe
    if (!fs.existsSync(enabledFile)) {
        fs.writeFileSync(enabledFile, JSON.stringify({}));
    }

    // Función para leer los comandos habilitados
    const getEnabled = () => JSON.parse(fs.readFileSync(enabledFile, 'utf-8'));
    const saveEnabled = (data) => fs.writeFileSync(enabledFile, JSON.stringify(data, null, 2));

    chappie.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const content = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!content) return;

        // Solo comandos que comiencen con .enable o .disable
        if (content.startsWith('.enable') || content.startsWith('.disable')) {

            // Verificar si el usuario es admin del grupo
            const groupMetadata = await chappie.groupMetadata(from).catch(() => null);
            const admins = groupMetadata?.participants?.filter(p => p.admin)?.map(a => a.id) || [];
            const sender = msg.key.participant || msg.key.remoteJid;
            if (!admins.includes(sender)) {
                await chappie.sendMessage(from, { text: '❌ Solo administradores pueden usar este comando.' });
                return;
            }

            const args = content.split(' ');
            const action = args[0].replace('.', ''); // enable o disable
            const cmdName = args[1]; // nombre del comando a activar/desactivar

            if (!cmdName) {
                await chappie.sendMessage(from, { text: '❌ Debes indicar el nombre del comando.' });
                return;
            }

            const enabled = getEnabled();

            if (!enabled[from]) enabled[from] = {};

            if (action === 'enable') {
                enabled[from][cmdName] = true;
                await chappie.sendMessage(from, { text: `✅ Comando ${cmdName} habilitado.` });
            } else {
                enabled[from][cmdName] = false;
                await chappie.sendMessage(from, { text: `❌ Comando ${cmdName} deshabilitado.` });
            }

            saveEnabled(enabled);
            console.log(chalk.green(`[✔ Comando ${action}]`), chalk.blue(cmdName), 'en grupo', chalk.magenta(from));
        }
    });

    // Función para verificar si un comando está habilitado
    chappie.isEnabled = (groupId, command) => {
        const enabled = getEnabled();
        return enabled[groupId]?.[command] !== false; // por defecto true
    };
};
