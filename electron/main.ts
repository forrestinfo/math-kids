import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import * as fs from 'fs'
import * as url from 'url'

let mainWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 800,
    minHeight: 680,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    title: '儿童计算练习',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// User data persistence
const userDataPath = join(app.getPath('userData'), 'users.json')

ipcMain.handle('save-users', (_event, users) => {
  try {
    fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('load-users', () => {
  try {
    if (fs.existsSync(userDataPath)) {
      const data = fs.readFileSync(userDataPath, 'utf-8')
      return { success: true, data: JSON.parse(data) }
    }
    return { success: true, data: [] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// Audio: look in extraResources first (guaranteed outside asar)
// then fall back to inside asar (dist/audio/)
function getAudioFile(filename: string): string | null {
  const candidates: string[] = []

  if (!isDev) {
    // Production: check extraResources first, then asar-dist folder
    candidates.push(
      join(process.resourcesPath || app.getAppPath(), 'audio', filename),
    )
    // Inside asar: app.asar/dist/audio/{filename}
    candidates.push(join(__dirname, '..', 'dist', 'audio', filename))
  } else {
    // Dev: public/audio/{filename}
    candidates.push(join(__dirname, '..', 'public', 'audio', filename))
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const buffer = fs.readFileSync(p)
      const ext = filename.split('.').pop() || 'mp3'
      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
      }
      const mime = mimeMap[ext] || 'audio/mpeg'
      return `data:${mime};base64,${buffer.toString('base64')}`
    }
  }
  return null
}

ipcMain.handle('get-audio-base64', (_event, filename: string) => {
  try {
    const data = getAudioFile(filename)
    if (data) return { success: true, data }
    return { success: false, error: 'File not found' }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// Image path: production uses file:// protocol from unpacked app directory
ipcMain.handle('get-image-path', (_event, filename: string) => {
  if (isDev) {
    return `/images/${filename}`
  }
  // In production: extraResources/images/meiledi.jpg
  // electron-builder unpacks extraResources next to the executable
  const imgPath = join(process.resourcesPath || app.getAppPath(), 'images', filename)
  if (fs.existsSync(imgPath)) {
    return `file://${imgPath.replace(/\\/g, '/')}`
  }
  // Fallback: inside asar (dev/build)
  const asarPath = join(__dirname, '..', 'dist', 'images', filename)
  if (fs.existsSync(asarPath)) {
    return `file://${asarPath.replace(/\\/g, '/')}`
  }
  return null
})
