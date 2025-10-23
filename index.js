#!/usr/bin/env node
import startChappie from './main.js'

async function runBot() {
  console.log('🚀 Iniciando Chappie- Bot...')
  try { await startChappie() }
  catch (err) {
    console.error('❌ Error crítico:', err)
    console.log('🔁 Reiniciando en 5 segundos...')
    setTimeout(runBot, 5000)
  }
}

process.on('uncaughtException', err => {
  console.error('💥 Excepción no capturada:', err)
  setTimeout(runBot, 5000)
})
process.on('unhandledRejection', reason => {
  console.error('💥 Rechazo de promesa no manejado:', reason)
  setTimeout(runBot, 5000)
})

runBot()