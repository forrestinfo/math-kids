import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveUsers: (users: unknown) => ipcRenderer.invoke('save-users', users),
  loadUsers: () => ipcRenderer.invoke('load-users'),
  getAudioBase64: (filename: string) => ipcRenderer.invoke('get-audio-base64', filename),
  getImagePath: (filename: string) => ipcRenderer.invoke('get-image-path', filename),
})
