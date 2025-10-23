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
  if (opcion === '1') {
    console.log('📱 Modo QR seleccionado')
    rl.close()
    await startChappie('qr')
  } else if (opcion === '2') {
    rl.question('📞 Ingresa tu número (ejemplo: 5215512345678): ', async (numero) => {
      rl.close()
      console.log(`🔑 Modo CODEBOT seleccionado para el número: ${numero}`)
      await startChappie('code', numero)
    })
  } else {
    console.log('❌ Opción inválida, usa 1 o 2')
    rl.close()
    process.exit(1)
  }
})