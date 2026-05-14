goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.async.run");
  goog.module.declareLegacyNamespace();
  const WorkQueue = goog.require("goog.async.WorkQueue");
  const asyncStackTag = goog.require("goog.debug.asyncStackTag");
  const nextTick = goog.require("goog.async.nextTick");
  const throwException = goog.require("goog.async.throwException");
  goog.ASSUME_NATIVE_PROMISE = goog.define("goog.ASSUME_NATIVE_PROMISE", false);
  let schedule;
  let workQueueScheduled = false;
  let workQueue = new WorkQueue();
  let run = (callback, context = undefined) => {
    if (!schedule) {
      initializeRunner();
    }
    if (!workQueueScheduled) {
      schedule();
      workQueueScheduled = true;
    }
    callback = asyncStackTag.wrap(callback, "goog.async.run");
    workQueue.add(callback, context);
  };
  let initializeRunner = () => {
    if (goog.ASSUME_NATIVE_PROMISE || goog.global.Promise && goog.global.Promise.resolve) {
      const promise = goog.global.Promise.resolve(undefined);
      schedule = () => {
        promise.then(run.processWorkQueue);
      };
    } else {
      schedule = () => {
        nextTick(run.processWorkQueue);
      };
    }
  };
  run.forceNextTick = (realSetTimeout = undefined) => {
    schedule = () => {
      nextTick(run.processWorkQueue);
      if (realSetTimeout) {
        realSetTimeout(run.processWorkQueue);
      }
    };
  };
  if (goog.DEBUG) {
    run.resetQueue = () => {
      workQueueScheduled = false;
      workQueue = new WorkQueue();
    };
    run.resetSchedulerForTest = () => {
      initializeRunner();
    };
  }
  run.processWorkQueue = () => {
    let item = null;
    while (item = workQueue.remove()) {
      try {
        item.fn.call(item.scope);
      } catch (e) {
        throwException(e);
      }
      workQueue.returnUnused(item);
    }
    workQueueScheduled = false;
  };
  exports = run;
  return exports;
});

//# sourceMappingURL=goog.async.run.js.map
