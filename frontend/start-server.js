#!/usr/bin/env node

const { spawn } = require('child_process');
const port = process.env.PORT || 8080;

console.log(`Starting server on port ${port}`);

const server = spawn('npx', ['serve', '-s', 'build', '-p', port.toString()], {
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error(`Failed to start server: ${error}`);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.kill('SIGINT');
});
