goog.provide("promesa.impl.promise");
goog.provide("promesa.impl.promise.PromiseImpl");
goog.provide("promesa.impl.promise.CancellationError");
goog.scope(function() {
  const self = promesa.impl.promise;
  const root = goog.global;
  const PENDING = Symbol("state/pending");
  const RESOLVED = Symbol("state/resolved");
  const REJECTED = Symbol("state/rejected");
  const QUEUE = Symbol("queue");
  const STATE = Symbol("state");
  const VALUE = Symbol("value");
  const RESOLVE_TYPE_FLATTEN = Symbol("resolve-type/flatten");
  const RESOLVE_TYPE_BIND = Symbol("resolve-type/bind");
  const RESOLVE_TYPE_MAP = Symbol("resolve-type/map");
  const defaultResolveMapHandler = v => v;
  const defaultResolveBindHandler = v => self.resolved(v);
  const defaultRejectHandler = c => {
    throw c;
  };
  class CancellationError extends Error {
  }
  class PromiseImpl {
    constructor(val) {
      this[QUEUE] = [];
      this[STATE] = PENDING;
      this[VALUE] = undefined;
      if (val !== undefined) {
        transition(this, RESOLVED, val);
      }
    }
    get state() {
      return this[STATE];
    }
    get value() {
      return this[VALUE];
    }
    then(resolve, reject) {
      const deferred = new PromiseImpl();
      this[QUEUE].push({type:RESOLVE_TYPE_FLATTEN, resolve:resolve ?? defaultResolveMapHandler, reject:reject ?? defaultRejectHandler, complete:completeDeferredFn(deferred)});
      process(this);
      return deferred;
    }
    catch(reject) {
      return this.then(null, reject);
    }
    finally(f) {
      this[QUEUE].push({type:RESOLVE_TYPE_FLATTEN, resolve:value => f(), reject:cause => f(), complete:(value, cause) => null});
      return this;
    }
    fmap(resolve, reject) {
      const deferred = new PromiseImpl();
      this[QUEUE].push({type:RESOLVE_TYPE_MAP, resolve:resolve ?? defaultResolveMapHandler, reject:reject ?? defaultRejectHandler, complete:completeDeferredFn(deferred)});
      process(this);
      return deferred;
    }
    fbind(resolve, reject) {
      const deferred = new PromiseImpl();
      this[QUEUE].push({type:RESOLVE_TYPE_BIND, resolve:resolve ?? defaultResolveBindHandler, reject:reject ?? defaultRejectHandler, complete:completeDeferredFn(deferred)});
      process(this);
      return deferred;
    }
    handle(fn, resolveType) {
      resolveType = resolveType ?? RESOLVE_TYPE_MAP;
      this[QUEUE].push({type:resolveType, resolve:defaultResolveMapHandler, reject:defaultRejectHandler, complete:fn});
      process(this);
    }
    resolve(value) {
      if (this[STATE] === PENDING) {
        transition(this, RESOLVED, value);
      }
      return null;
    }
    reject(cause) {
      if (this[STATE] === PENDING) {
        transition(this, REJECTED, cause);
      }
      return null;
    }
    isPending() {
      const state = this[STATE];
      return state === PENDING;
    }
    isResolved() {
      const state = this[STATE];
      return state === RESOLVED;
    }
    isRejected() {
      const state = this[STATE];
      return state === REJECTED;
    }
    isCancelled() {
      const state = this[STATE];
      const value = this[VALUE];
      return state === REJECTED && isCancellationError(value);
    }
    cancel() {
      this.reject(new CancellationError("promise cancelled"));
    }
  }
  const nextTick = (() => {
    if (typeof root.Promise === "function") {
      const resolved = Promise.resolve(null);
      return function queueMicrotaskWithPromise(f, p) {
        resolved.then(() => f(p));
      };
    } else if (typeof root.setImmediate === "function") {
      return root.setImmediate;
    } else if (typeof root.setTimeout === "function") {
      return (f, p) => root.setTimeout(f, 0, p);
    } else {
      return (f, p) => f.call(this, p);
    }
  })();
  function isCancellationError(v) {
    return v instanceof CancellationError;
  }
  function fmtValue(o) {
    if (isThenable(o)) {
      return `<PROMISE:${goog.getUid(o)}>`;
    } else if (o instanceof Error) {
      return `<EXCEPTION:'${o.message}'>`;
    } else if (o === null || o === undefined) {
      return `${o}`;
    } else if (typeof o === "function") {
      return `<FN:${goog.getUid(o)}>`;
    } else {
      return `${o.toString()}`;
    }
  }
  function isSome(o) {
    return o !== null && o !== undefined;
  }
  function isFunction(o) {
    return typeof o === "function";
  }
  function isThenable(o) {
    if (goog.isObject(o)) {
      const thenFn = o.then;
      return isFunction(thenFn);
    } else {
      return false;
    }
  }
  function constantly(v) {
    return () => v;
  }
  function identity(v) {
    return v;
  }
  function isPromiseImpl(v) {
    return v instanceof PromiseImpl;
  }
  function completeDeferredFn(deferred) {
    return (value, cause) => {
      if (cause) {
        deferred.reject(cause);
      } else {
        deferred.resolve(value);
      }
    };
  }
  function process(p) {
    if (p[STATE] === PENDING) {
      return;
    }
    nextTick(processNextTick, p);
    return p;
  }
  function processNextTick(p) {
    if (p[QUEUE].length === 0) {
      return;
    }
    const state = p[STATE];
    const value = p[VALUE];
    let task, rvalue, rcause;
    while (p[QUEUE].length) {
      task = p[QUEUE].shift();
      try {
        if (state === RESOLVED) {
          rvalue = task.resolve(value);
        } else if (state === REJECTED) {
          rvalue = task.reject(value);
        } else {
          rcause = new TypeError("invalid state");
        }
      } catch (e) {
        rcause = e;
      }
      resolveTask(task, rvalue, rcause);
    }
  }
  function resolveTask(task, value, cause) {
    if (task.complete === undefined) {
      return;
    }
    if (cause) {
      task.complete(null, cause);
    } else {
      if (task.type === RESOLVE_TYPE_MAP) {
        task.complete(value, null);
      } else if (task.type === RESOLVE_TYPE_FLATTEN) {
        if (isPromiseImpl(value)) {
          value.handle((v, c) => {
            resolveTask(task, v, c);
          });
        } else if (isThenable(value)) {
          value.then(v => {
            resolveTask(task, v, null);
          }, c => {
            resolveTask(task, null, c);
          });
        } else {
          task.complete(value, null);
        }
      } else if (task.type === RESOLVE_TYPE_BIND) {
        if (isPromiseImpl(value)) {
          value.handle((v, c) => {
            task.complete(v, c);
          });
        } else if (isThenable(value)) {
          value.then(v => {
            task.complete(v, null);
          }, c => {
            task.complete(null, c);
          });
        } else {
          task.complete(null, new TypeError("expected thenable"));
        }
      } else {
        task.complete(null, new TypeError("internal: invalid resolve type"));
      }
    }
  }
  function transition(p, state, value) {
    if (p[STATE] === state || p[STATE] !== PENDING) {
      return;
    }
    p[STATE] = state;
    p[VALUE] = value;
    return processNextTick(p);
  }
  self.PromiseImpl = PromiseImpl;
  self.CancellationError = CancellationError;
  self.isCancellationError = isCancellationError;
  self.deferred = () => {
    return new PromiseImpl();
  };
  const NULL_PROMISE = new PromiseImpl(null);
  self.resolved = function resolved(value) {
    if (value === null) {
      return NULL_PROMISE;
    } else {
      const p = new PromiseImpl();
      p[STATE] = RESOLVED;
      p[VALUE] = value;
      return p;
    }
  };
  self.rejected = function rejected(reason) {
    const p = new PromiseImpl();
    p[STATE] = REJECTED;
    p[VALUE] = reason;
    return p;
  };
  self.all = function all(promises) {
    return promises.reduce((acc, p) => {
      return acc.then(results => {
        return self.coerce(p).fmap(v => {
          results.push(v);
          return results;
        });
      });
    }, self.resolved([]));
  };
  self.coerce = function coerce(promise) {
    if (promise instanceof PromiseImpl) {
      return promise;
    } else if (isThenable(promise)) {
      const deferred = self.deferred();
      promise.then(v => {
        deferred.resolve(v);
      }, c => {
        deferred.reject(c);
      });
      return deferred;
    } else if (promise instanceof Error) {
      return self.rejected(promise);
    } else {
      return self.resolved(promise);
    }
  };
  self.race = function race(promises) {
    const deferred = self.deferred();
    promises.forEach(p => {
      self.coerce(p).handle((v, c) => {
        if (c) {
          deferred.reject(c);
        } else {
          deferred.resolve(v);
        }
      });
    });
    return deferred;
  };
  self.nextTick = nextTick;
  self.PENDING = PENDING;
  self.RESOLVED = RESOLVED;
  self.REJECTED = REJECTED;
});

//# sourceMappingURL=promesa.impl.promise.js.map
