#!/usr/bin/env node
// index.js — Punto de entrada del bot

import readline from 'readline'
import startBot from './main.js'  // Asegúrate de que main.js exporte `default`

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('===============================')
console.log('⚙️  Iniciando Chappie-Bot')
console.log('===============================')
console.log('Selecciona modo de conexión:')
console.log('1) Escanear QR')
console.log('2) Emparejamiento por código')
rl.question('Introduce 1 o 2: ', async (respuesta) => {
  rl.close()
  const opcion = respuesta.trim()
  
  if (opcion === '1') {
    console.log('📲 Opción 1 seleccionada: Escaneo de QR')
    await startBot({ mode: 'qr' })
  } else if (opcion === '2') {
    console.log('🔑 Opción 2 seleccionada: Emparejamiento por código')
    await startBot({ mode: 'code' })
  } else {
    console.log('❌ Opción inválida. El bot se cerrará.')
    process.exit(0)
  }
})