// index.js - Punto de entrada del bot Chappie-
// Inicializa el bot y maneja recargas automáticas en caso de errores.

const { startBot } = require('./main');

// Función para iniciar el bot con manejo de errores y recarga
async function init() {
    try {
        console.log('Iniciando Chappie Bot...');
        await startBot();
    } catch (error) {
        console.error('Error al iniciar el bot:', error);
        console.log('Reiniciando en 5 segundos...');
        setTimeout(init, 5000);  // Recarga automática después de 5 segundos
    }
}

// Iniciar el bot
init();