import readline from 'readline'
import { startChappie } from './main.js'

console.clear()
console.log(`
===============================
⚙️  Iniciando Chappie-Bot
===============================
Selecciona modo de conexión:
1) Escanear QR
2) Emparejamiento por código
`)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Introduce 1 o 2: ', async (opcion) => {
  rl.close()
  if (opcion === '1') {
    console.log('📱 Modo QR seleccionado')
    await startChappie('qr')
  } else if (opcion === '2') {
    console.log('🔑 Modo CODEBOT seleccionado')
    await startChappie('code')
  } else {
    console.log('❌ Opción inválida, usa 1 o 2')
    process.exit(1)
  }
})