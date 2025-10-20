const fs = require('fs');
const GROUP_SETTINGS_PATH = './groupSettings.json';

// Carga o inicializa la configuración
function loadSettings() {
    if (!fs.existsSync(GROUP_SETTINGS_PATH)) {
        fs.writeFileSync(GROUP_SETTINGS_PATH, '{}');
    }
    return JSON.parse(fs.readFileSync(GROUP_SETTINGS_PATH));
}

// Guarda la configuración
function saveSettings(settings) {
    fs.writeFileSync(GROUP_SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

/**
 * Comando: !enable <feature> / !disable <feature>
 * Features soportadas: welcome, antilink, antiprivado, modoadmin
 */
async function handleEnableDisable({ conn, m, args }) {
    if (!m.isGroup) return conn.sendMessage(m.chat, { text: 'Este comando solo funciona en grupos.' }, { quoted: m });

    const settings = loadSettings();
    const groupId = m.chat;
    const feature = args[0]?.toLowerCase();
    const action = m.command.includes('enable') ? true : false;

    const validFeatures = ['welcome', 'antilink', 'antiprivado', 'modoadmin'];
    if (!validFeatures.includes(feature)) {
        return conn.sendMessage(m.chat, { text: `Función inválida. Usa: ${validFeatures.join(', ')}` }, { quoted: m });
    }

    if (!settings[groupId]) settings[groupId] = {};
    settings[groupId][feature] = action;
    saveSettings(settings);

    conn.sendMessage(m.chat, { text: `✅ ${action ? 'Activado' : 'Desactivado'} *${feature}* para este grupo.` }, { quoted: m });
}

module.exports = handleEnableDisable;