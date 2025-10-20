const fs = import('fs');

// Lista negra de grupos, si quieres excluir algunos grupos
const gruposExcluidos = [
  // '1234567890-123456789@g.us', // ejemplo de ID de grupo a excluir
];

const welkom = require('./carpeta/welkom.js');

// Dentro del manejador de eventos
sock.ev.on('group-participants.update', async (m) => {
  await welkom(sock, { ...m, event: 'group-participants.update' });
});

module.exports = async (sock, m) => {
  // Escucha eventos de participantes que se unen o salen
  if (m.event === 'group-participants.update') {
    const { id, participants, action } = m;
    if (gruposExcluidos.includes(id)) return; // Si quieres excluir un grupo

    if (action === 'add') {
      for (const user of participants) {
        // Puedes personalizar el mensaje aquí
        const mensaje = `👋 ¡Hola @${user.split('@')[0]}!\n🌟 Bienvenido/a al grupo.\n\nPor favor, lee las reglas y participa respetuosamente.`;
        await sock.sendMessage(id, {
          text: mensaje,
          mentions: [user],
        });
      }
    }
    // Si quieres despedida, puedes usar el siguiente bloque
    if (action === 'remove') {
      for (const user of participants) {
        const mensaje = `👋 Adiós @${user.split('@')[0]}, ¡te extrañaremos!`;
        await sock.sendMessage(id, {
          text: mensaje,
          mentions: [user],
        });
      }
    }
    */
  }
};
