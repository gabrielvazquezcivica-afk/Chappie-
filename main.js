const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializamos el cliente de WhatsApp con guardado local de sesión.
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Evento para mostrar el QR en la terminal.
client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Evento para mostrar que el cliente está listo.
client.on('ready', () => {
    console.log('¡El bot está listo y conectado a WhatsApp!');
});

// Evento para recibir mensajes.
client.on('message', message => {
    if (message.body === '!ping') {
        message.reply('¡Pong!');
    }
});

// Iniciamos el cliente.
client.initialize();
