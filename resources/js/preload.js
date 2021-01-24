const fs = require('fs')
const path = require('path')
const { ipcRenderer, contextBridge, shell } = require('electron')

contextBridge.exposeInMainWorld('apis', {
  doAction: async (arg) => {
    return await ipcRenderer.invoke('main', arg)
  },

  on: (channel, callback) => {
    const newCallback = (_, data) => callback(data)
    ipcRenderer.on(channel, newCallback)
  },

  checkForUpdates: async (...args) => {
    await ipcRenderer.invoke('check-for-updates', ...args)
  },

  setUpdatesCallback (cb) {
    if (typeof cb !== 'function') return

    const channel = 'updates-callback'
    ipcRenderer.removeAllListeners(channel)
    ipcRenderer.on(channel, cb)
  },

  installUpdatesAndQuitApp () {
    ipcRenderer.invoke('install-updates', true)
  },

  async openExternal (url, options) {
    await shell.openExternal(url, options)
  },

  async copyFileToAssets (repoPathRoot, to, from) {
    if (fs.statSync(from).isDirectory()) {
      throw new Error('not support copy directory')
    }

    const dest = path.join(repoPathRoot, to)
    const assetsRoot = path.dirname(dest)

    if (!/assets$/.test(assetsRoot)) {
      throw new Error('illegal assets dirname')
    }

    await fs.promises.mkdir(assetsRoot, { recursive: true })
    await fs.promises.copyFile(from, dest)
  }
})
