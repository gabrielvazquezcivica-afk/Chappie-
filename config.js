require('dotenv').config();

module.exports = {
  ownerNumber: process.env.OWNER_NUMBER || '523310167470',
  prefix: process.env.PREFIX || '.',
  sessionName: process.env.SESSION_NAME || 'Itachi 🚀',
  welcomeMessage: process.env.WELCOME_MESSAGE || '¡Hola! Soy Chappie 🤖',
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || '',
  messages: {
    success: '✅ Éxito!',
    admin: 'Este comando es solo para administradores!',
    botAdmin: 'Necesito ser administrador!',
    owner: 'Solo mi creador puede usar este comando!',
    group: 'Este comando solo funciona en grupos!',
    private: 'Este comando solo funciona en privado!',
    bot: 'Este comando es solo para el bot!',
    wait: '⏳ Procesando...',
    error: '❌ Ocurrió un error!',
  }
};


// Para agregar global.owner, puedes incluir lo siguiente:
global.owner = [
  ['523310167470', 'GABO', true]
];