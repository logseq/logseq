const originImportScripts = globalThis.importScripts
const importScripts = (url) => {
  originImportScripts(
    (location.href.startsWith('blob') ? 'file://PWD_ROOT/static/js/' : '') + url
  )
};;