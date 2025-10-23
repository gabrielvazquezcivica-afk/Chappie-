import readline from 'readline'
import { startChappie } from './main.js'

console.clear()
console.log(`
===============================
⚙️  Iniciando Chappie-Bot
===============================
Selecciona modo de conexión:
1) Escanear QR
2) Mostrar número (solo referencia) y usar QR
`)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Introduce 1 o 2: ', async (opcion) => {
  if (opcion === '1') {
    rl.close()
    await startChappie('qr')
  } else if (opcion === '2') {
    rl.question('📞 Ingresa tu número: ', async (numero) => {
      rl.close()
      console.log(`🔑 Número registrado: ${numero}`)
      console.log('⚠️ Se usará QR para emparejar y evitar error 405')
      await startChappie('qr', numero)
    })
  } else {
    console.log('❌ Opción inválida')
    rl.close()
    process.exit(1)
  }
})