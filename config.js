module.exports = {
  ownerNumber: '523310167470', // Número del dueño con código de país
  prefix: '!', // Prefijo para los comandos
  sessionName: 'whatsapp-session', // Nombre del archivo de sesión
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
  },
  // Puedes agregar más configuraciones aquí
}

// Si usas Node.js >=18, fetch ya está disponible. Si no, instala node-fetch:
// npm install node-fetch

const fetch = require("node-fetch"); // Si usas Node.js <18

async function consumirAPI() {
  const url = "https://api.ejemplo.com/datos";
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error("Error en la petición");
    const datos = await respuesta.json();
    console.log(datos);
  } catch (error) {
    console.error("Error al consumir la API:", error);
  }
}

consumirAPI();
