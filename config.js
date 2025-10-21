import dotenv from 'dotenv';
dotenv.config();

export const ownerNumber = process.env.OWNER_NUMBER || '523310167470';
export const prefix = process.env.PREFIX || '.';
export const sessionName = process.env.SESSION_NAME || 'Chappie 🔱';
export const welcomeMessage = process.env.WELCOME_MESSAGE || '¡Hola! Soy Chappie 🤖';
export const port = process.env.PORT || 3000;
export const apiKey = process.env.API_KEY || '';
export const messages = {
  success: '✅ Éxito!',
  admin: 'Este comando es solo para administradores!',
  botAdmin: 'Necesito ser administrador!',
  owner: 'Solo mi creador puede usar este comando!',
  group: 'Este comando solo funciona en grupos!',
  private: 'Este comando solo funciona en privado!',
  bot: 'Este comando es solo para el bot!',
  wait: '⏳ Procesando...',
  error: '❌ Ocurrió un error!',
};

// Para agregar global.owner, puedes incluir lo siguiente:
global.owner = [
  ['523310167470', 'GABO', true]
];