const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, screen, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store()

let mainWindow = null
let tray = null
let isVisible = true

// App URL - using production Vercel URL
const APP_URL = process.env.APP_URL || 'https://techscreen-clone.vercel.app'

// Prevent multiple instances - must be called synchronously at startup
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!isVisible) toggleVisibility()
      mainWindow.focus()
    }
  })

  // App lifecycle
  app.whenReady().then(() => {
    createWindow()
    createTray()
    registerGlobalShortcuts()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    x: width - 620,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Make window invisible to screen capture
  // This is the KEY feature for invisibility
  mainWindow.setContentProtection(true)

  // macOS specific: Make visible on all workspaces
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  }

  // Windows specific
  if (process.platform === 'win32') {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
  }

  mainWindow.loadURL(`${APP_URL}/desktop/assistant`)

  // Hide from Alt+Tab (Windows)
  mainWindow.setSkipTaskbar(true)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open DevTools for debugging (remove in production)
  // mainWindow.webContents.openDevTools({ mode: 'detach' })
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, 'assets', 'icon.png')

  // Create a simple icon if asset doesn't exist
  let icon
  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    // Create a simple colored icon if no file exists
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon.isEmpty() ? createDefaultIcon() : icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => toggleVisibility(),
    },
    {
      label: 'Open Dashboard',
      click: () => {
        mainWindow?.loadURL(`${APP_URL}/dashboard`)
        if (!isVisible) toggleVisibility()
      },
    },
    {
      label: 'Open Assistant',
      click: () => {
        mainWindow?.loadURL(`${APP_URL}/desktop/assistant`)
        if (!isVisible) toggleVisibility()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ])

  tray.setToolTip('TechScreen AI')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    toggleVisibility()
  })
}

function createDefaultIcon() {
  // Create a simple 16x16 purple icon
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)

  for (let i = 0; i < size * size * 4; i += 4) {
    canvas[i] = 139     // R
    canvas[i + 1] = 92  // G
    canvas[i + 2] = 246 // B
    canvas[i + 3] = 255 // A
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function toggleVisibility() {
  if (!mainWindow) return

  if (isVisible) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
  isVisible = !isVisible
}

function registerGlobalShortcuts() {
  // Toggle visibility: CMD/CTRL + 9
  globalShortcut.register('CommandOrControl+9', () => {
    toggleVisibility()
  })

  // Microphone: CMD/CTRL + 2
  globalShortcut.register('CommandOrControl+2', () => {
    mainWindow?.webContents.send('shortcut', 'microphone')
  })

  // PC Audio: CMD/CTRL + 3
  globalShortcut.register('CommandOrControl+3', () => {
    mainWindow?.webContents.send('shortcut', 'pc-audio')
  })

  // Screenshot: CMD/CTRL + 4
  globalShortcut.register('CommandOrControl+4', () => {
    captureScreen()
  })

  // Clear: CMD/CTRL + Shift + C
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    mainWindow?.webContents.send('shortcut', 'clear')
  })

  // Submit: CMD/CTRL + Shift + Space
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    mainWindow?.webContents.send('shortcut', 'submit')
  })
}

async function captureScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    })

    if (sources.length > 0) {
      const screenshot = sources[0].thumbnail.toDataURL()
      mainWindow?.webContents.send('screenshot', screenshot)
    }
  } catch (error) {
    console.error('Screenshot error:', error)
  }
}

// IPC Handlers
ipcMain.handle('get-sources', async () => {
  return await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 150, height: 150 },
  })
})

ipcMain.handle('capture-screen', async () => {
  return await captureScreen()
})

ipcMain.on('set-always-on-top', (event, value) => {
  mainWindow?.setAlwaysOnTop(value)
})

ipcMain.on('set-opacity', (event, value) => {
  mainWindow?.setOpacity(value)
})
