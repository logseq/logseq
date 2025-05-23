const fs = require('fs')
const path = require('path')
const { ipcRenderer, contextBridge, shell, clipboard, webFrame } = require('electron')

const IS_MAC = process.platform === 'darwin'
const IS_WIN32 = process.platform === 'win32'

const ALLOWED_EXTERNAL_PROTOCOLS = ['https:', 'http:', 'mailto:', 'zotero:', 'file:']

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

/**
 * Read the contents of the clipboard for a custom format.
 * @param  {string} format The custom format to read.
 * @returns Buffer containing the contents of the clipboard for the specified format, or null if not available.
 */
function getClipboardData (format) {
  if (clipboard.has(format, "clipboard")) {
    return clipboard.readBuffer(format)
  }
  else {
    return null;
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
    const protocol = new URL(url).protocol
    if (!ALLOWED_EXTERNAL_PROTOCOLS.includes(protocol)) {
      throw new Error('illegal protocol')
    }
    await shell.openExternal(url, options)
  },

  async openPath (path) {
    await shell.openPath(path)
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

  getClipboardData,

  setZoomFactor (factor) {
    webFrame.setZoomFactor(factor)
  },

  setZoomLevel (level) {
    webFrame.setZoomLevel(level)
  },

  isAbsolutePath: path.isAbsolute.bind(path)
})
