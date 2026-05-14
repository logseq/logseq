goog.provide("goog.log");
goog.provide("goog.log.Level");
goog.provide("goog.log.LogBuffer");
goog.provide("goog.log.LogRecord");
goog.provide("goog.log.Logger");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.log.Loggable;
goog.log.ENABLED = goog.define("goog.log.ENABLED", goog.debug.LOGGING_ENABLED);
goog.log.ROOT_LOGGER_NAME = "";
goog.log.Level = class Level {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
  toString() {
    return this.name;
  }
};
goog.log.Level.OFF = new goog.log.Level("OFF", Infinity);
goog.log.Level.SHOUT = new goog.log.Level("SHOUT", 1200);
goog.log.Level.SEVERE = new goog.log.Level("SEVERE", 1000);
goog.log.Level.WARNING = new goog.log.Level("WARNING", 900);
goog.log.Level.INFO = new goog.log.Level("INFO", 800);
goog.log.Level.CONFIG = new goog.log.Level("CONFIG", 700);
goog.log.Level.FINE = new goog.log.Level("FINE", 500);
goog.log.Level.FINER = new goog.log.Level("FINER", 400);
goog.log.Level.FINEST = new goog.log.Level("FINEST", 300);
goog.log.Level.ALL = new goog.log.Level("ALL", 0);
goog.log.Level.PREDEFINED_LEVELS = [goog.log.Level.OFF, goog.log.Level.SHOUT, goog.log.Level.SEVERE, goog.log.Level.WARNING, goog.log.Level.INFO, goog.log.Level.CONFIG, goog.log.Level.FINE, goog.log.Level.FINER, goog.log.Level.FINEST, goog.log.Level.ALL];
goog.log.Level.predefinedLevelsCache_ = null;
goog.log.Level.createPredefinedLevelsCache_ = function() {
  goog.log.Level.predefinedLevelsCache_ = {};
  for (let i = 0, level; level = goog.log.Level.PREDEFINED_LEVELS[i]; i++) {
    goog.log.Level.predefinedLevelsCache_[level.value] = level;
    goog.log.Level.predefinedLevelsCache_[level.name] = level;
  }
};
goog.log.Level.getPredefinedLevel = function(name) {
  if (!goog.log.Level.predefinedLevelsCache_) {
    goog.log.Level.createPredefinedLevelsCache_();
  }
  return goog.log.Level.predefinedLevelsCache_[name] || null;
};
goog.log.Level.getPredefinedLevelByValue = function(value) {
  if (!goog.log.Level.predefinedLevelsCache_) {
    goog.log.Level.createPredefinedLevelsCache_();
  }
  if (value in goog.log.Level.predefinedLevelsCache_) {
    return goog.log.Level.predefinedLevelsCache_[value];
  }
  for (let i = 0; i < goog.log.Level.PREDEFINED_LEVELS.length; ++i) {
    let level = goog.log.Level.PREDEFINED_LEVELS[i];
    if (level.value <= value) {
      return level;
    }
  }
  return null;
};
goog.log.Logger = class Logger {
  getName() {
  }
};
goog.log.Logger.Level = goog.log.Level;
goog.log.LogBuffer = class LogBuffer {
  constructor(capacity) {
    this.capacity_ = typeof capacity === "number" ? capacity : goog.log.LogBuffer.CAPACITY;
    this.buffer_;
    this.curIndex_;
    this.isFull_;
    this.clear();
  }
  addRecord(level, msg, loggerName) {
    if (!this.isBufferingEnabled()) {
      return new goog.log.LogRecord(level, msg, loggerName);
    }
    const curIndex = (this.curIndex_ + 1) % this.capacity_;
    this.curIndex_ = curIndex;
    if (this.isFull_) {
      const ret = this.buffer_[curIndex];
      ret.reset(level, msg, loggerName);
      return ret;
    }
    this.isFull_ = curIndex == this.capacity_ - 1;
    return this.buffer_[curIndex] = new goog.log.LogRecord(level, msg, loggerName);
  }
  forEachRecord(func) {
    const buffer = this.buffer_;
    if (!buffer[0]) {
      return;
    }
    const curIndex = this.curIndex_;
    let i = this.isFull_ ? curIndex : -1;
    do {
      i = (i + 1) % this.capacity_;
      func(buffer[i]);
    } while (i !== curIndex);
  }
  isBufferingEnabled() {
    return this.capacity_ > 0;
  }
  isFull() {
    return this.isFull_;
  }
  clear() {
    this.buffer_ = new Array(this.capacity_);
    this.curIndex_ = -1;
    this.isFull_ = false;
  }
};
goog.log.LogBuffer.instance_;
goog.log.LogBuffer.CAPACITY = goog.define("goog.debug.LogBuffer.CAPACITY", 0);
goog.log.LogBuffer.getInstance = function() {
  if (!goog.log.LogBuffer.instance_) {
    goog.log.LogBuffer.instance_ = new goog.log.LogBuffer(goog.log.LogBuffer.CAPACITY);
  }
  return goog.log.LogBuffer.instance_;
};
goog.log.LogBuffer.isBufferingEnabled = function() {
  return goog.log.LogBuffer.getInstance().isBufferingEnabled();
};
goog.log.LogRecord = class LogRecord {
  constructor(level, msg, loggerName, time, sequenceNumber) {
    this.level_;
    this.loggerName_;
    this.msg_;
    this.time_;
    this.sequenceNumber_;
    this.exception_ = undefined;
    this.reset(level || goog.log.Level.OFF, msg, loggerName, time, sequenceNumber);
  }
  reset(level, msg, loggerName, time, sequenceNumber) {
    this.time_ = time || goog.now();
    this.level_ = level;
    this.msg_ = msg;
    this.loggerName_ = loggerName;
    this.exception_ = undefined;
    this.sequenceNumber_ = typeof sequenceNumber === "number" ? sequenceNumber : goog.log.LogRecord.nextSequenceNumber_;
  }
  getLoggerName() {
    return this.loggerName_;
  }
  setLoggerName(name) {
    this.loggerName_ = name;
  }
  getException() {
    return this.exception_;
  }
  setException(exception) {
    this.exception_ = exception;
  }
  getLevel() {
    return this.level_;
  }
  setLevel(level) {
    this.level_ = level;
  }
  getMessage() {
    return this.msg_;
  }
  setMessage(msg) {
    this.msg_ = msg;
  }
  getMillis() {
    return this.time_;
  }
  setMillis(time) {
    this.time_ = time;
  }
  getSequenceNumber() {
    return this.sequenceNumber_;
  }
};
goog.log.LogRecord.nextSequenceNumber_ = 0;
goog.log.LogRecordHandler;
goog.log.LogRegistryEntry_ = class LogRegistryEntry_ {
  constructor(name, parent = null) {
    this.level = null;
    this.handlers = [];
    this.parent = parent || null;
    this.children = [];
    this.logger = {getName:() => name};
  }
  getEffectiveLevel() {
    if (this.level) {
      return this.level;
    } else if (this.parent) {
      return this.parent.getEffectiveLevel();
    }
    goog.asserts.fail("Root logger has no level set.");
    return goog.log.Level.OFF;
  }
  publish(logRecord) {
    let target = this;
    while (target) {
      target.handlers.forEach(handler => {
        handler(logRecord);
      });
      target = target.parent;
    }
  }
};
goog.log.LogRegistry_ = class LogRegistry_ {
  constructor() {
    this.entries = {};
    const rootLogRegistryEntry = new goog.log.LogRegistryEntry_(goog.log.ROOT_LOGGER_NAME);
    rootLogRegistryEntry.level = goog.log.Level.CONFIG;
    this.entries[goog.log.ROOT_LOGGER_NAME] = rootLogRegistryEntry;
  }
  getLogRegistryEntry(name, level) {
    const entry = this.entries[name];
    if (entry) {
      if (level !== undefined) {
        entry.level = level;
      }
      return entry;
    } else {
      const lastDotIndex = name.lastIndexOf(".");
      const parentName = name.slice(0, Math.max(lastDotIndex, 0));
      const parentLogRegistryEntry = this.getLogRegistryEntry(parentName);
      const logRegistryEntry = new goog.log.LogRegistryEntry_(name, parentLogRegistryEntry);
      this.entries[name] = logRegistryEntry;
      parentLogRegistryEntry.children.push(logRegistryEntry);
      if (level !== undefined) {
        logRegistryEntry.level = level;
      }
      return logRegistryEntry;
    }
  }
  getAllLoggers() {
    return Object.keys(this.entries).map(loggerName => this.entries[loggerName].logger);
  }
};
goog.log.LogRegistry_.getInstance = function() {
  if (!goog.log.LogRegistry_.instance_) {
    goog.log.LogRegistry_.instance_ = new goog.log.LogRegistry_();
  }
  return goog.log.LogRegistry_.instance_;
};
goog.log.LogRegistry_.instance_;
goog.log.getLogger = function(name, level) {
  if (goog.log.ENABLED) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(name, level);
    return loggerEntry.logger;
  } else {
    return null;
  }
};
goog.log.getRootLogger = function() {
  if (goog.log.ENABLED) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(goog.log.ROOT_LOGGER_NAME);
    return loggerEntry.logger;
  } else {
    return null;
  }
};
goog.log.addHandler = function(logger, handler) {
  if (goog.log.ENABLED && logger) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    loggerEntry.handlers.push(handler);
  }
};
goog.log.removeHandler = function(logger, handler) {
  if (goog.log.ENABLED && logger) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    const indexOfHandler = loggerEntry.handlers.indexOf(handler);
    if (indexOfHandler !== -1) {
      loggerEntry.handlers.splice(indexOfHandler, 1);
      return true;
    }
  }
  return false;
};
goog.log.setLevel = function(logger, level) {
  if (goog.log.ENABLED && logger) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    loggerEntry.level = level;
  }
};
goog.log.getLevel = function(logger) {
  if (goog.log.ENABLED && logger) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    return loggerEntry.level;
  }
  return null;
};
goog.log.getEffectiveLevel = function(logger) {
  if (goog.log.ENABLED && logger) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    return loggerEntry.getEffectiveLevel();
  }
  return goog.log.Level.OFF;
};
goog.log.isLoggable = function(logger, level) {
  if (goog.log.ENABLED && logger && level) {
    return level.value >= goog.log.getEffectiveLevel(logger).value;
  }
  return false;
};
goog.log.getAllLoggers = function() {
  if (goog.log.ENABLED) {
    return goog.log.LogRegistry_.getInstance().getAllLoggers();
  }
  return [];
};
goog.log.getLogRecord = function(logger, level, msg, exception = undefined) {
  const logRecord = goog.log.LogBuffer.getInstance().addRecord(level || goog.log.Level.OFF, msg, logger.getName());
  logRecord.setException(exception);
  return logRecord;
};
goog.log.publishLogRecord = function(logger, logRecord) {
  if (goog.log.ENABLED && logger && goog.log.isLoggable(logger, logRecord.getLevel())) {
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    loggerEntry.publish(logRecord);
  }
};
goog.log.log = function(logger, level, msg, exception = undefined) {
  if (goog.log.ENABLED && logger && goog.log.isLoggable(logger, level)) {
    level = level || goog.log.Level.OFF;
    const loggerEntry = goog.log.LogRegistry_.getInstance().getLogRegistryEntry(logger.getName());
    if (typeof msg === "function") {
      msg = msg();
    }
    const logRecord = goog.log.LogBuffer.getInstance().addRecord(level, msg, logger.getName());
    logRecord.setException(exception);
    loggerEntry.publish(logRecord);
  }
};
goog.log.error = function(logger, msg, exception = undefined) {
  if (goog.log.ENABLED && logger) {
    goog.log.log(logger, goog.log.Level.SEVERE, msg, exception);
  }
};
goog.log.warning = function(logger, msg, exception = undefined) {
  if (goog.log.ENABLED && logger) {
    goog.log.log(logger, goog.log.Level.WARNING, msg, exception);
  }
};
goog.log.info = function(logger, msg, exception = undefined) {
  if (goog.log.ENABLED && logger) {
    goog.log.log(logger, goog.log.Level.INFO, msg, exception);
  }
};
goog.log.fine = function(logger, msg, exception = undefined) {
  if (goog.log.ENABLED && logger) {
    goog.log.log(logger, goog.log.Level.FINE, msg, exception);
  }
};

//# sourceMappingURL=goog.log.log.js.map
