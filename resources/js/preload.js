const fs = require('fs')
const path = require('path')
const { ipcRenderer, contextBridge, shell, clipboard } = require('electron')

const IS_MAC = process.platform === 'darwin'
const IS_WIN32 = process.platform === 'win32'

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

  /**
   * When from is empty. The resource maybe from
   * client paste or screenshoot.
   * @param repoPathRoot
   * @param to
   * @param from?
   * @returns {Promise<void>}
   */
  async copyFileToAssets (repoPathRoot, to, from) {
    if (from && fs.statSync(from).isDirectory()) {
      throw new Error('not support copy directory')
    }

    const dest = path.join(repoPathRoot, to)
    const assetsRoot = path.dirname(dest)

    if (!/assets$/.test(assetsRoot)) {
      throw new Error('illegal assets dirname')
    }

    await fs.promises.mkdir(assetsRoot, { recursive: true })

    from = !from && getFilePathFromClipboard()

    if (from) {
      // console.debug('copy file: ', from, dest)
      return await fs.promises.copyFile(from, dest)
    }

    // support image
    const nImg = clipboard.readImage()

    if (nImg && !nImg.isEmpty()) {
      const rawExt = path.extname(dest)
      return await fs.promises.writeFile(
        dest.replace(rawExt, '.png'),
        nImg.toPNG()
      )
    }

    // fns
    function getFilePathFromClipboard () {
      if (IS_WIN32) {
        const rawFilePath = clipboard.read('FileNameW')
        return rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '')
      }

      return clipboard.read('public.file-url').replace('file://', '')
    }
  }
})
