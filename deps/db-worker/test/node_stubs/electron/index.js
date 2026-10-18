// Minimal electron stub for node-based melange tests. Only provides the
// surfaces desktop modules touch at require time (app.getPath/getName);
// the tests never drive real Electron APIs.
const os = require("os");
const path = require("path");

const tmpBase = path.join(os.tmpdir(), "logseq-electron-stub");

const app = {
  getPath: (name) => path.join(tmpBase, String(name)),
  getName: () => "Logseq",
  getVersion: () => "0.0.0-test",
  isPackaged: false,
  whenReady: () => Promise.resolve(),
  on: () => {},
  once: () => {},
  quit: () => {},
  requestSingleInstanceLock: () => true,
  setAppUserModelId: () => {},
};

const noop = () => {};

module.exports = {
  app,
  ipcMain: { handle: noop, handleOnce: noop, on: noop, once: noop, removeHandler: noop },
  BrowserWindow: class {},
  Menu: class {
    static setApplicationMenu() {}
    static buildFromTemplate() { return new this(); }
    popup() {}
    append() {}
  },
  MenuItem: class {},
  shell: { openExternal: () => Promise.resolve(), openPath: () => Promise.resolve("") },
  dialog: {
    showErrorBox: noop,
    showMessageBox: () => Promise.resolve({ response: 0 }),
    showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
  },
  nativeTheme: { shouldUseDarkColors: false, on: noop },
  session: { defaultSession: { setSpellCheckerEnabled: noop } },
  clipboard: { writeText: noop, readText: () => "" },
  screen: { getPrimaryDisplay: () => ({ workAreaSize: { width: 1024, height: 768 } }) },
  net: { fetch: fetch },
};
