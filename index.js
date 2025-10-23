#!/usr/bin/env node
import readline from 'readline'
import startChappie from './main.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 Bienvenido a Chappie- Bot')
console.log('Elige la opción de conexión:')
console.log('1 - Escanear QR')
console.log('2 - Usar CodeBot (pairing code)')

rl.question('Selecciona 1 o 2: ', async (answer) => {
  rl.close()

  switch(answer.trim()) {
    case '1':
      console.log('📲 Opción QR seleccionada')
      await startChappie({ useQRCode: true })
      break
    case '2':
      console.log('🔑 Opción CodeBot seleccionada')
      await startChappie({ useQRCode: false })
      break
    default:
      console.log('❌ Opción inválida. Reinicia el bot e intenta de nuevo.')
      process.exit(0)
  }
})