const path = require('path')
const { readdir, lstat } = require('fs').promises

// workaround from https://github.com/electron/electron/issues/426#issuecomment-658901422
// We set an intercept on incoming requests to disable x-frame-options
// headers.

export const disableXFrameOptions = (win) => {
  win.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] },
    (d, c) => {
      if (d.responseHeaders['X-Frame-Options']) {
        delete d.responseHeaders['X-Frame-Options']
      } else if (d.responseHeaders['x-frame-options']) {
        delete d.responseHeaders['x-frame-options']
      }

      c({ cancel: false, responseHeaders: d.responseHeaders })
    }
  )
}

export async function getAllFiles (dir, exts) {
  const dirents = await readdir(dir, { withFileTypes: true })

  if (exts) {
    !Array.isArray(exts) && (exts = [exts])

    exts = exts.map(it => {
      if (it && !it.startsWith('.')) {
        it = '.' + it
      }

      return it?.toLowerCase()
    })
  }

  const files = await Promise.all(dirents.map(async (dirent) => {
    if (exts && !exts.includes(path.extname(dirent.name))) {
      return null
    }

    const filePath = path.resolve(dir, dirent.name)
    const fileStats = await lstat(filePath)
    const stats = {
      size: fileStats.size,
      accessTime: fileStats.atimeMs,
      modifiedTime: fileStats.mtimeMs,
      changeTime: fileStats.ctimeMs,
      birthTime: fileStats.birthtimeMs
    }
    return dirent.isDirectory() ? getAllFiles(filePath) : {
      path: filePath, ...stats
    }
  }))
  return files.flat().filter(it => it != null)
}
