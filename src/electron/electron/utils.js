import path from 'path'
import fse from 'fs-extra'

// workaround from https://github.com/electron/electron/issues/426#issuecomment-658901422
// We set an intercept on incoming requests to disable x-frame-options
// headers.

// Should we do this? Does this make evil sites doing danagerous things?
export const disableXFrameOptions = (win) => {
  win.webContents.session.webRequest.onHeadersReceived((d, c) => {
    if (d.responseHeaders['X-Frame-Options']) {
      delete d.responseHeaders['X-Frame-Options']
    }

    if (d.responseHeaders['x-frame-options']) {
      delete d.responseHeaders['x-frame-options']
    }

    if (d.responseHeaders['Content-Security-Policy']) {
      delete d.responseHeaders['Content-Security-Policy']
    }

    if (d.responseHeaders['content-security-policy']) {
      delete d.responseHeaders['content-security-policy']
    }

    c({ cancel: false, responseHeaders: d.responseHeaders })
  })
}

export async function getAllFiles(dir, exts) {
  const dirents = await fse.readdir(dir, { withFileTypes: true })

  if (exts != null) {
    !Array.isArray(exts) && (exts = [exts])

    exts = exts.map((it) => {
      if (typeof it === 'string' && it !== '' && !it.startsWith('.')) {
        it = '.' + it
      }

      return it?.toLowerCase()
    })
  }

  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const filePath = path.resolve(dir, dirent.name)

      if (dirent.isDirectory()) {
        return getAllFiles(filePath, exts)
      }

      if (exts && !exts.includes(path.extname(dirent.name)?.toLowerCase())) {
        return null
      }

      const fileStats = await fse.lstat(filePath)

      return {
        path: filePath,
        size: fileStats.size,
        accessTime: fileStats.atimeMs,
        modifiedTime: fileStats.mtimeMs,
        changeTime: fileStats.ctimeMs,
        birthTime: fileStats.birthtimeMs
      }
    })
  )
  return files.flat().filter((it) => it != null)
}

export async function deepReadDir(dirPath, flat = true) {
  const ret = await Promise.all(
    (
      await fse.readdir(dirPath)
    ).map(async (entity) => {
      const root = path.join(dirPath, entity)
      return (await fse.lstat(root)).isDirectory()
        ? await deepReadDir(root)
        : root
    })
  )

  if (flat) {
    return ret?.flat()
  }

  return ret
}
