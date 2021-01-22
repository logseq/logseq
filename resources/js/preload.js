const { ipcRenderer, contextBridge, shell } = require('electron')

contextBridge.exposeInMainWorld('apis', {
  doAction: async (arg) => {
    return await ipcRenderer.invoke('main', arg)
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
  }
})
