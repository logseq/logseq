'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval', version = 1) {
        this.storeName = storeName;
        this._dbName = dbName;
        this._storeName = storeName;
        this._version = version;
        this.id = `dbName:${dbName};;storeName:${storeName}`;
        this._init();
    }
    _init() {
      if (this._dbp) {
        return;
      }
      this._dbp = new Promise((resolve, reject) => {
        const openreq = window.indexedDB.open(this._dbName, this._version);
        openreq.onerror = () => reject(openreq.error);
        openreq.onsuccess = () => resolve(openreq.result);
        // First time setup: create an empty object store
        openreq.onupgradeneeded = () => {
          openreq.result.createObjectStore(this._storeName);
        };
      });
    }
    _withIDBStore(type, callback) {
        this._init();
        return this._dbp.then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, type);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            callback(transaction.objectStore(this.storeName));
        }));
    }
    _close() {
        this._init();
        return this._dbp.then(db => {
            db.close();
            this._dbp = undefined;
        });
    }
}
class Batcher {
    constructor(executor) {
        this.executor = executor;
        this.items = [];
    }
  async process() {
        const toProcess = this.items;
        this.items = [];
        await this.executor(toProcess.map(({ item }) => item));
        toProcess.map(({ onProcessed }) => onProcessed());
        if (this.items.length) {
            this.ongoing = this.process();
        }
        else {
            this.ongoing = undefined;
        }
    }
    async queue(item) {
        const result = new Promise((resolve) => this.items.push({ item, onProcessed: resolve }));
        if (!this.ongoing)
            this.ongoing = this.process();
        return result;
    }
}
let store;
function getDefaultStore() {
    if (!store)
        store = new Store();
    return store;
}
function get(key, store = getDefaultStore()) {
    let req;
    return store._withIDBStore('readwrite', store => {
        req = store.get(key);
    }).then(() => req.result);
}
const setBatchers = {};
function set(key, value, store = getDefaultStore()) {
    if (!setBatchers[store.id]) {
        setBatchers[store.id] = new Batcher((items) => store._withIDBStore('readwrite', store => {
            for (const item of items) {
                store.put(item.value, item.key);
            }
        }));
    }
    return setBatchers[store.id].queue({ key, value });
}
function setBatch(items, store = getDefaultStore()) {
  return store._withIDBStore('readwrite', store => {
    for (const item of items) {
            store.put(item.value, item.key);
    }
  });
}
function update(key, updater, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        const req = store.get(key);
        req.onsuccess = () => {
            store.put(updater(req.result), key);
        };
    });
}
function del(key, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.delete(key);
    });
}
function clear(store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.clear();
    });
}
function keys(store = getDefaultStore()) {
    const keys = [];
    return store._withIDBStore('readwrite', store => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result)
                return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(() => keys);
}
function close(store = getDefaultStore()) {
    return store._close();
}

exports.Store = Store;
exports.get = get;
exports.set = set;
exports.setBatch = setBatch;
exports.update = update;
exports.del = del;
exports.clear = clear;
exports.keys = keys;
exports.close = close;
