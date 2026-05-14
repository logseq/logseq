goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.async.WorkQueue");
  goog.module.declareLegacyNamespace();
  const FreeList = goog.require("goog.async.FreeList");
  const {assert} = goog.require("goog.asserts");
  class WorkQueue {
    constructor() {
      this.workHead_ = null;
      this.workTail_ = null;
    }
    add(fn, scope) {
      const item = this.getUnusedItem_();
      item.set(fn, scope);
      if (this.workTail_) {
        this.workTail_.next = item;
        this.workTail_ = item;
      } else {
        assert(!this.workHead_);
        this.workHead_ = item;
        this.workTail_ = item;
      }
    }
    remove() {
      let item = null;
      if (this.workHead_) {
        item = this.workHead_;
        this.workHead_ = this.workHead_.next;
        if (!this.workHead_) {
          this.workTail_ = null;
        }
        item.next = null;
      }
      return item;
    }
    returnUnused(item) {
      WorkQueue.freelist_.put(item);
    }
    getUnusedItem_() {
      return WorkQueue.freelist_.get();
    }
  }
  WorkQueue.DEFAULT_MAX_UNUSED = goog.define("goog.async.WorkQueue.DEFAULT_MAX_UNUSED", 100);
  WorkQueue.freelist_ = new FreeList(() => new WorkItem(), item => item.reset(), WorkQueue.DEFAULT_MAX_UNUSED);
  class WorkItem {
    constructor() {
      this.fn = null;
      this.scope = null;
      this.next = null;
    }
    set(fn, scope) {
      this.fn = fn;
      this.scope = scope;
      this.next = null;
    }
    reset() {
      this.fn = null;
      this.scope = null;
      this.next = null;
    }
  }
  exports = WorkQueue;
  return exports;
});

//# sourceMappingURL=goog.async.workqueue.js.map
