shadow$provide.module$frontend$idbkv = function(global, require, module, exports) {
  function getDefaultStore() {
    store ||= new Store();
    return store;
  }
  Object.defineProperty(exports, "__esModule", {value:!0});
  class Store {
    constructor(dbName = "keyval-store", storeName = "keyval", version = 1) {
      this.storeName = storeName;
      this._dbName = dbName;
      this._storeName = storeName;
      this._version = version;
      this.id = `dbName:${dbName};;storeName:${storeName}`;
      this._init();
    }
    _init() {
      this._dbp || (this._dbp = new Promise((resolve, reject) => {
        const openreq = ("object" == typeof window ? window.indexedDB : indexedDB).open(this._dbName, this._version);
        openreq.onerror = () => reject(openreq.error);
        openreq.onsuccess = () => resolve(openreq.result);
        openreq.onupgradeneeded = () => {
          openreq.result.createObjectStore(this._storeName);
        };
      }));
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
        this._dbp = void 0;
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
      await this.executor(toProcess.map(({item}) => item));
      toProcess.map(({onProcessed}) => onProcessed());
      this.ongoing = this.items.length ? this.process() : void 0;
    }
    async queue(item) {
      const result = new Promise(resolve => this.items.push({item, onProcessed:resolve}));
      this.ongoing || (this.ongoing = this.process());
      return result;
    }
  }
  let store;
  const setBatchers = {};
  exports.newStore = function(dbName = "keyval-store", storeName = "keyval", version = 1) {
    return new Store(dbName, storeName, version);
  };
  exports.get = function(key, store = getDefaultStore()) {
    let req;
    return store._withIDBStore("readwrite", store => {
      req = store.get(key);
    }).then(() => req.result);
  };
  exports.set = function(key, value, store = getDefaultStore()) {
    setBatchers[store.id] || (setBatchers[store.id] = new Batcher(items => store._withIDBStore("readwrite", store => {
      for (const item of items) {
        store.put(item.value, item.key);
      }
    })));
    return setBatchers[store.id].queue({key, value});
  };
  exports.setBatch = function(items, store = getDefaultStore()) {
    return store._withIDBStore("readwrite", store => {
      for (const item of items) {
        store.put(item.value, item.key);
      }
    });
  };
  exports.update = function(key, updater, store = getDefaultStore()) {
    return store._withIDBStore("readwrite", store => {
      const req = store.get(key);
      req.onsuccess = () => {
        store.put(updater(req.result), key);
      };
    });
  };
  exports.del = function(key, store = getDefaultStore()) {
    return store._withIDBStore("readwrite", store => {
      store.delete(key);
    });
  };
  exports.clear = function(store = getDefaultStore()) {
    return store._withIDBStore("readwrite", store => {
      store.clear();
    });
  };
  exports.keys = function(store = getDefaultStore()) {
    const keys = [];
    return store._withIDBStore("readwrite", store => {
      (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
        this.result && (keys.push(this.result.key), this.result.continue());
      };
    }).then(() => keys);
  };
  exports.close = function(store = getDefaultStore()) {
    return store._close();
  };
};

//# sourceMappingURL=module$frontend$idbkv.js.map
