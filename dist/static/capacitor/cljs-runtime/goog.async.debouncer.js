goog.provide("goog.async.Debouncer");
goog.require("goog.Disposable");
goog.require("goog.Timer");
goog.async.Debouncer = function(listener, interval, opt_handler) {
  goog.async.Debouncer.base(this, "constructor");
  this.listener_ = opt_handler != null ? goog.bind(listener, opt_handler) : listener;
  this.interval_ = interval;
  this.callback_ = goog.bind(this.onTimer_, this);
  this.shouldFire_ = false;
  this.pauseCount_ = 0;
  this.timer_ = null;
  this.refireAt_ = null;
  this.args_ = [];
};
goog.inherits(goog.async.Debouncer, goog.Disposable);
goog.async.Debouncer.prototype.fire = function(var_args) {
  this.args_ = arguments;
  this.shouldFire_ = false;
  if (this.timer_) {
    this.refireAt_ = goog.now() + this.interval_;
    return;
  }
  this.timer_ = goog.Timer.callOnce(this.callback_, this.interval_);
};
goog.async.Debouncer.prototype.stop = function() {
  this.clearTimer_();
  this.refireAt_ = null;
  this.shouldFire_ = false;
  this.args_ = [];
};
goog.async.Debouncer.prototype.pause = function() {
  ++this.pauseCount_;
};
goog.async.Debouncer.prototype.resume = function() {
  if (!this.pauseCount_) {
    return;
  }
  --this.pauseCount_;
  if (!this.pauseCount_ && this.shouldFire_) {
    this.doAction_();
  }
};
goog.async.Debouncer.prototype.disposeInternal = function() {
  this.stop();
  goog.async.Debouncer.base(this, "disposeInternal");
};
goog.async.Debouncer.prototype.onTimer_ = function() {
  this.clearTimer_();
  if (this.refireAt_) {
    this.timer_ = goog.Timer.callOnce(this.callback_, this.refireAt_ - goog.now());
    this.refireAt_ = null;
    return;
  }
  if (!this.pauseCount_) {
    this.doAction_();
  } else {
    this.shouldFire_ = true;
  }
};
goog.async.Debouncer.prototype.clearTimer_ = function() {
  if (this.timer_) {
    goog.Timer.clear(this.timer_);
    this.timer_ = null;
  }
};
goog.async.Debouncer.prototype.doAction_ = function() {
  this.shouldFire_ = false;
  this.listener_.apply(null, this.args_);
};

//# sourceMappingURL=goog.async.debouncer.js.map
