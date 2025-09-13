const { contextBridge } = require('electron');

// Expose a minimal, audited API surface to the renderer.
// Add methods here as needed; avoid exposing Node primitives directly.
contextBridge.exposeInMainWorld('desktopAPI', {
  // example no-op; fill with safe IPC hooks when required
  ping: () => 'pong',
});