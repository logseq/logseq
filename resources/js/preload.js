const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
  doAction: async (arg) => {
    return await ipcRenderer.invoke('main', arg);
  }
});
