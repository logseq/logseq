const fs = require('fs')
const path = require('path')
const { ipcRenderer, contextBridge, shell, clipboard, webFrame } = require('electron')

const IS_MAC = process.platform === 'darwin'
const IS_WIN32 = process.platform === 'win32'

function getFilePathFromClipboard () {
  if (IS_WIN32) {
    const rawFilePath = clipboard.read('FileNameW')
    return rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '')
  } else if (IS_MAC) {
    return clipboard.read('public.file-url').replace('file://', '')
  } else {
    return clipboard.readText()
  }
}

contextBridge.exposeInMainWorld('apis', {
  doAction: async (arg) => {
    return await ipcRenderer.invoke('main', arg)
  },

  invoke: async (channel, args) => {
    return await ipcRenderer.invoke(channel, ...args)
  },

  addListener: ipcRenderer.on.bind(ipcRenderer),
  removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer),

  on: (channel, callback) => {
    const newCallback = (_, data) => callback(data)
    ipcRenderer.on(channel, newCallback)
  },

  off: (channel, callback) => {
    if (!callback) {
      ipcRenderer.removeAllListeners(channel)
    } else {
      ipcRenderer.removeListener(channel, callback)
    }
  },

  once: (channel, callback) => {
    ipcRenderer.on(channel, callback)
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

  async openPath (path) {
    await shell.openPath(path)
  },

  showItemInFolder (fullpath) {
    if (IS_WIN32) {
      shell.openPath(path.dirname(fullpath).replaceAll("/", "\\"))
    } else {
      shell.showItemInFolder(fullpath)
    }
  },

  /**
   * save all publish assets to disk
   *
   * @param {string} html html file with embedded state
   */
  exportPublishAssets (html, customCSSPath, exportCSSPath, repoPath, assetFilenames, outputDir) {
    ipcRenderer.invoke(
      'export-publish-assets',
      html,
      customCSSPath,
      exportCSSPath,
      repoPath,
      assetFilenames,
      outputDir
    )
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

    from = from && decodeURIComponent(from || getFilePathFromClipboard())

    if (from) {
      // console.debug('copy file: ', from, dest)
      await fs.promises.copyFile(from, dest)
      return path.basename(from)
    }

    // support image
    // console.debug('read image: ', from, dest)
    const nImg = clipboard.readImage()

    if (nImg && !nImg.isEmpty()) {
      const rawExt = path.extname(dest)
      return await fs.promises.writeFile(
        dest.replace(rawExt, '.png'),
        nImg.toPNG()
      )
    }
  },

  toggleMaxOrMinActiveWindow (isToggleMin = false) {
    ipcRenderer.invoke('toggle-max-or-min-active-win', isToggleMin)
  },

  /**
   * internal
   * @param type
   * @param args
   * @private
   */
  async _callApplication (type, ...args) {
    return await ipcRenderer.invoke('call-application', type, ...args)
  },

  /**
   * internal
   * @param type
   * @param args
   * @private
   */
  async _callMainWin (type, ...args) {
    return await ipcRenderer.invoke('call-main-win', type, ...args)
  },

  getFilePathFromClipboard,

  setZoomFactor (factor) {
    webFrame.setZoomFactor(factor)
  },

  setZoomLevel (level) {
    webFrame.setZoomLevel(level)
  },

  isAbsolutePath: path.isAbsolute.bind(path)
})
