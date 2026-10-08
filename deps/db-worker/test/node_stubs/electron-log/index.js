// Minimal electron-log stand-in for tests running under plain node.
// The real package is only resolvable inside the packaged Electron app.
const noop = () => {};
module.exports = {
  debug: noop,
  verbose: noop,
  info: noop,
  warn: noop,
  error: noop,
  silly: noop,
  transports: {},
};
