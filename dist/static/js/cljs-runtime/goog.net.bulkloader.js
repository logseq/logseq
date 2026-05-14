goog.provide("goog.net.BulkLoader");
goog.require("goog.events.Event");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.log");
goog.require("goog.net.BulkLoaderHelper");
goog.require("goog.net.EventType");
goog.require("goog.net.XhrIo");
goog.requireType("goog.Uri");
goog.net.BulkLoader = function(uris) {
  goog.events.EventTarget.call(this);
  this.helper_ = new goog.net.BulkLoaderHelper(uris);
  this.eventHandler_ = new goog.events.EventHandler(this);
};
goog.inherits(goog.net.BulkLoader, goog.events.EventTarget);
goog.net.BulkLoader.prototype.logger_ = goog.log.getLogger("goog.net.BulkLoader");
goog.net.BulkLoader.prototype.getResponseTexts = function() {
  return this.helper_.getResponseTexts();
};
goog.net.BulkLoader.prototype.getRequestUris = function() {
  return this.helper_.getUris();
};
goog.net.BulkLoader.prototype.load = function() {
  const eventHandler = this.eventHandler_;
  const uris = this.helper_.getUris();
  goog.log.info(this.logger_, "Starting load of code with " + uris.length + " uris.");
  for (let i = 0; i < uris.length; i++) {
    const xhrIo = new goog.net.XhrIo();
    eventHandler.listen(xhrIo, goog.net.EventType.COMPLETE, goog.bind(this.handleEvent_, this, i));
    xhrIo.send(uris[i]);
  }
};
goog.net.BulkLoader.prototype.handleEvent_ = function(id, e) {
  goog.log.info(this.logger_, 'Received event "' + e.type + '" for id ' + id + " with uri " + this.helper_.getUri(id));
  const xhrIo = e.target;
  if (xhrIo.isSuccess()) {
    this.handleSuccess_(id, xhrIo);
  } else {
    this.handleError_(id, xhrIo);
  }
};
goog.net.BulkLoader.prototype.handleSuccess_ = function(id, xhrIo) {
  this.helper_.setResponseText(id, xhrIo.getResponseText());
  if (this.helper_.isLoadComplete()) {
    this.finishLoad_();
  }
  xhrIo.dispose();
};
goog.net.BulkLoader.prototype.handleError_ = function(id, xhrIo) {
  this.dispatchEvent(new goog.net.BulkLoader.LoadErrorEvent(xhrIo.getStatus()));
  xhrIo.dispose();
};
goog.net.BulkLoader.prototype.finishLoad_ = function() {
  goog.log.info(this.logger_, "All uris loaded.");
  this.dispatchEvent(goog.net.EventType.SUCCESS);
};
goog.net.BulkLoader.prototype.disposeInternal = function() {
  goog.net.BulkLoader.superClass_.disposeInternal.call(this);
  this.eventHandler_.dispose();
  this.eventHandler_ = null;
  this.helper_.dispose();
  this.helper_ = null;
};
goog.net.BulkLoader.LoadErrorEvent = function(status) {
  goog.net.BulkLoader.LoadErrorEvent.base(this, "constructor", goog.net.EventType.ERROR);
  this.status = status;
};
goog.inherits(goog.net.BulkLoader.LoadErrorEvent, goog.events.Event);

//# sourceMappingURL=goog.net.bulkloader.js.map
