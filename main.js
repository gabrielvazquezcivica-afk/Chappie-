import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { createRequire } from 'module'
const require = createRequire(import.meta.url) // permite usar require en ES Modules

// 🧠 Función para cargar los plugins desde "plugins" y "almacenamiento"
export async function cargarPlugins() {
  const comandos = new Map()
  const carpetas = ['plugins', 'almacenamiento']

  console.log(chalk.cyan.bold('=============================='))
  console.log(chalk.cyan.bold('⚙️  Cargando Plugins de Chappie'))
  console.log(chalk.cyan.bold('==============================\n'))

  for (const carpeta of carpetas) {
    const dir = path.resolve(`./${carpeta}`)
    if (!fs.existsSync(dir)) {
      console.log(chalk.yellow(`⚠️  Carpeta ${carpeta} no encontrada.`))
      continue
    }

    const archivos = fs.readdirSync(dir).filter(a => a.endsWith('.js'))
    if (archivos.length === 0) {
      console.log(chalk.yellow(`⚠️  No hay archivos en ${carpeta}/`))
      continue
    }

    console.log(chalk.blue.bold(`📂 Leyendo carpeta: ${carpeta}/`))

    for (const archivo of archivos) {
      try {
        const ruta = path.join(dir, archivo)
        let mod

        // Intentar importar como ESM
        try {
          mod = await import(`file://${ruta}`)
        } catch {
          // Si falla, cargar como CommonJS
          mod = require(ruta)
        }

        const cmd = mod.default || mod
        if (cmd?.nombre && typeof cmd?.ejecutar === 'function') {
          comandos.set(cmd.nombre.toLowerCase(), cmd)
          console.log(chalk.green(`✅ ${cmd.nombre} (${carpeta}/${archivo}) cargado correctamente`))
        } else {
          console.log(chalk.gray(`⚙️  ${archivo} cargado (sin comando directo)`))
        }

      } catch (err) {
        console.log(chalk.red(`❌ Error cargando ${archivo}: ${err.message}`))
      }
    }
  }

  console.log(chalk.cyan.bold('\n=============================='))
  console.log(chalk.cyan(`📦 Total comandos cargados: ${comandos.size}`))
  console.log(chalk.cyan.bold('==============================\n'))

  return comandos
}