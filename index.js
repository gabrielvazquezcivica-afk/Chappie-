#!/usr/bin/env node
// index.js — Punto de entrada avanzado de Chappie-

import { startChappie } from './main.js'

async function runBot() {
  console.log('🚀 Iniciando Chappie- Bot...')
  
  try {
    await startChappie()
  } catch (error) {
    console.error('❌ Error crítico al iniciar Chappie-:', error)
    console.log('🔁 Reiniciando el bot en 5 segundos...')
    setTimeout(runBot, 5000)
  }
}

// Manejo de errores globales para reconexión
process.on('uncaughtException', (err) => {
  console.error('💥 Excepción no capturada:', err)
  console.log('🔁 Reiniciando el bot en 5 segundos...')
  setTimeout(runBot, 5000)
})

process.on('unhandledRejection', (reason) => {
  console.error('💥 Rechazo de promesa no manejado:', reason)
  console.log('🔁 Reiniciando el bot en 5 segundos...')
  setTimeout(runBot, 5000)
})

// Ejecutar el bot
runBot()