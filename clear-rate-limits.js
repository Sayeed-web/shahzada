#!/usr/bin/env node

console.log('🔄 Clearing rate limits and restarting application...')

// This script helps clear any in-memory rate limit data
// by restarting the development server

const { spawn } = require('child_process')
const path = require('path')

// Kill any existing Next.js processes
console.log('📋 Stopping existing processes...')

// For Windows
if (process.platform === 'win32') {
  spawn('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'inherit' })
  
  setTimeout(() => {
    console.log('🚀 Starting development server...')
    const child = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    })
    
    child.on('error', (error) => {
      console.error('❌ Error starting server:', error)
    })
  }, 2000)
} else {
  // For Unix-like systems
  spawn('pkill', ['-f', 'next'], { stdio: 'inherit' })
  
  setTimeout(() => {
    console.log('🚀 Starting development server...')
    const child = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      cwd: __dirname
    })
    
    child.on('error', (error) => {
      console.error('❌ Error starting server:', error)
    })
  }, 2000)
}

console.log('✅ Rate limits cleared! Server will restart in 2 seconds...')