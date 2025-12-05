const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods for renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Shortcuts
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut', (event, action) => callback(action))
  },

  // Screenshot
  onScreenshot: (callback) => {
    ipcRenderer.on('screenshot', (event, data) => callback(data))
  },

  // Screen capture
  getSources: () => ipcRenderer.invoke('get-sources'),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),

  // Desktop sources for system audio capture
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),

  // Window controls
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
  setOpacity: (value) => ipcRenderer.send('set-opacity', value),

  // Platform info
  platform: process.platform,
})

// Add CSS for frameless window drag
window.addEventListener('DOMContentLoaded', () => {
  // Add draggable region style
  const style = document.createElement('style')
  style.textContent = `
    .electron-drag {
      -webkit-app-region: drag;
    }
    .electron-no-drag {
      -webkit-app-region: no-drag;
    }
  `
  document.head.appendChild(style)
})
