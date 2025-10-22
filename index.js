// index.js - Gestor principal y recargador automático para Chappie Bot
// Este archivo maneja la inicialización del bot y la recarga automática de comandos en la carpeta 'almacenamiento/'

const fs = require('fs');
const path = require('path');
const main = require('./main'); // Importa el módulo principal del bot

// Directorio donde se almacenan los comandos
const commandsDir = path.join(__dirname, 'almacenamiento');

// Función para recargar un módulo específico (borra la caché y lo vuelve a requerir)
function reloadModule(modulePath) {
    try {
        delete require.cache[require.resolve(modulePath)];
        const reloaded = require(modulePath);
        console.log(`Módulo recargado: ${path.basename(modulePath)}`);
        return reloaded;
    } catch (error) {
        console.error(`Error al recargar ${modulePath}:`, error.message);
        return null;
    }
}

// Función para recargar todos los comandos en la carpeta 'almacenamiento'
function reloadCommands() {
    const commands = {};
    fs.readdirSync(commandsDir).forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(commandsDir, file);
            const commandName = path.basename(file, '.js');
            commands[commandName] = reloadModule(filePath);
        }
    });
    // Aquí puedes actualizar el objeto global de comandos en main.js si es necesario
    if (main.updateCommands) {
        main.updateCommands(commands);
    }
    console.log('Comandos recargados automáticamente.');
}

// Configura un watcher para la carpeta 'almacenamiento' para detectar cambios y recargar automáticamente
fs.watch(commandsDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.js') && (eventType === 'change' || eventType === 'rename')) {
        console.log(`Cambio detectado en: ${filename}`);
        reloadCommands();
    }
});

// Inicializa los comandos al inicio
reloadCommands();

// Inicia el bot principal
main.start().catch(console.error);