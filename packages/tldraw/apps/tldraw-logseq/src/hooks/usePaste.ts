import {
  getSizeFromSrc,
  isNonNullable,
  TLAsset,
  TLBinding,
  TLCursor,
  TLPasteEventInfo,
  TLShapeModel,
  uniqueId,
  validUUID,
} from '@tldraw/core'
import type { TLReactApp, TLReactCallbacks } from '@tldraw/react'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { NIL as NIL_UUID } from 'uuid'
import {
  HTMLShape,
  IFrameShape,
  ImageShape,
  PdfShape,
  LogseqPortalShape,
  VideoShape,
  YouTubeShape,
  YOUTUBE_REGEX,
  TweetShape,
  TWITTER_REGEX,
  type Shape,
} from '../lib'
import { LogseqContext, LogseqContextValue } from '../lib/logseq-context'

const isValidURL = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.host && ['http:', 'https:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

interface Asset extends TLAsset {
  size?: number[]
}

const assetExtensions = {
  image: ['.png', '.svg', '.jpg', '.jpeg', '.gif'],
  video: ['.mp4', '.webm', '.ogg'],
  pdf: ['.pdf'],
}

function getFileType(filename: string) {
  // Get extension, verify that it's an image
  const extensionMatch = filename.match(/\.[0-9a-z]+$/i)
  if (!extensionMatch) return 'unknown'
  const extension = extensionMatch[0].toLowerCase()

  const [type, _extensions] = Object.entries(assetExtensions).find(([_type, extensions]) =>
    extensions.includes(extension)
  ) ?? ['unknown', null]

  return type
}

type MaybeShapes = TLShapeModel[] | null | undefined

type CreateShapeFN<Args extends any[]> = (...args: Args) => Promise<MaybeShapes> | MaybeShapes

/**
 * Try create a shape from a list of create shape functions. If one of the functions returns a
 * shape, return it, otherwise try again for the next one until all have been tried.
 */
function tryCreateShapeHelper<Args extends any[]>(...fns: CreateShapeFN<Args>[]) {
  return async (...args: Args) => {
    for (const fn of fns) {
      const result = await fn(...(args as any))
      if (result && result.length > 0) {
        return result
      }
    }
    return null
  }
}

// TODO: support file types
async function getDataFromType(item: DataTransfer | ClipboardItem, type: `text/${string}`) {
  if (!item.types.includes(type)) {
    return null
  }
  if (item instanceof DataTransfer) {
    return item.getData(type)
  }
  const blob = await item.getType(type)
  return await blob.text()
}

const handleCreatingShapes = async (
  app: TLReactApp<Shape>,
  { point, shiftKey, dataTransfer, fromDrop }: TLPasteEventInfo,
  handlers: LogseqContextValue['handlers']
) => {
  let imageAssetsToCreate: Asset[] = []
  let assetsToClone: TLAsset[] = []
  const bindingsToCreate: TLBinding[] = []

  async function createAssetsFromURL(url: string, type: string): Promise<Asset> {
    // Do we already have an asset for this image?
    const existingAsset = Object.values(app.assets).find(asset => asset.src === url)
    if (existingAsset) {
      return existingAsset as Asset
    }

    // Create a new asset for this image
    const asset: Asset = {
      id: uniqueId(),
      type: type,
      src: url,
      size: await getSizeFromSrc(handlers.makeAssetUrl(url), type),
    }
    return asset
  }

  async function createAssetsFromFiles(files: File[]) {
    const tasks = files
      .filter(file => getFileType(file.name) !== 'unknown')
      .map(async file => {
        try {
          const dataurl = await handlers.saveAsset(file)
          return await createAssetsFromURL(dataurl, getFileType(file.name))
        } catch (err) {
          console.error(err)
        }
        return null
      })
    return (await Promise.all(tasks)).filter(isNonNullable)
  }

  function createHTMLShape(text: string) {
    return [
      {
        ...HTMLShape.defaultProps,
        html: text,
        point: [point[0], point[1]],
      },
    ]
  }

  async function tryCreateShapesFromDataTransfer(dataTransfer: DataTransfer) {
    return tryCreateShapeHelper(
      tryCreateShapeFromFilePath,
      tryCreateShapeFromFiles,
      tryCreateShapeFromPageName,
      tryCreateShapeFromBlockUUID,
      tryCreateShapeFromTextPlain,
      tryCreateShapeFromTextHTML,
      tryCreateLogseqPortalShapesFromString
    )(dataTransfer)
  }

  async function tryCreateShapesFromClipboard() {
    const items = await navigator.clipboard.read()
    const createShapesFn = tryCreateShapeHelper(
      tryCreateShapeFromTextPlain,
      tryCreateShapeFromTextHTML,
      tryCreateLogseqPortalShapesFromString
    )
    const allShapes = (await Promise.all(items.map(item => createShapesFn(item))))
      .flat()
      .filter(isNonNullable)

    return allShapes
  }

  async function tryCreateShapeFromFilePath(item: DataTransfer) {
    const file = item.getData('file')
    if (!file) return null

    const asset = await createAssetsFromURL(file, 'pdf')
    app.addAssets([asset])

    const newShape = {
      ...PdfShape.defaultProps,
      id: uniqueId(),
      assetId: asset.id,
      url: file,
      opacity: 1,
    }

    if (asset.size) {
      Object.assign(newShape, {
        point: [point[0] - asset.size[0] / 4 + 16, point[1] - asset.size[1] / 4 + 16],
        size: Vec.div(asset.size, 2),
      })
    }
    return [newShape]
  }

  async function tryCreateShapeFromFiles(item: DataTransfer) {
    const files = Array.from(item.files)
    if (files.length > 0) {
      const assets = await createAssetsFromFiles(files)
      // ? could we get rid of this side effect?
      imageAssetsToCreate = assets

      return assets.map((asset, i) => {
        let defaultProps = null

        switch (asset.type) {
          case 'video':
            defaultProps = VideoShape.defaultProps
            break
          case 'image':
            defaultProps = ImageShape.defaultProps
            break
          case 'pdf':
            defaultProps = PdfShape.defaultProps
            break
          default:
            return null
        }

        const newShape = {
          ...defaultProps,
          id: uniqueId(),
          // TODO: Should be place near the last edited shape
          assetId: asset.id,
          opacity: 1,
        }

        if (asset.size) {
          Object.assign(newShape, {
            point: [point[0] - asset.size[0] / 4 + i * 16, point[1] - asset.size[1] / 4 + i * 16],
            size: Vec.div(asset.size, 2),
          })
        }

        return newShape
      })
    }
    return null
  }

  async function tryCreateShapeFromTextHTML(item: DataTransfer | ClipboardItem) {
    // skips if it's a drop event or using shift key
    if (item.types.includes('text/plain') && (shiftKey || fromDrop)) {
      return null
    }
    const rawText = await getDataFromType(item, 'text/html')
    if (rawText) {
      return tryCreateShapeHelper(tryCreateClonedShapesFromJSON, createHTMLShape)(rawText)
    }
    return null
  }

  async function tryCreateShapeFromBlockUUID(dataTransfer: DataTransfer) {
    // This is a Logseq custom data type defined in frontend.components.block
    const rawText = dataTransfer.getData('block-uuid')
    if (rawText) {
      const text = rawText.trim()
      const allSelectedBlocks = window.logseq?.api?.get_selected_blocks?.()
      const blockUUIDs =
        allSelectedBlocks && allSelectedBlocks?.length > 1
          ? allSelectedBlocks.map(b => b.uuid)
          : [text]
      // ensure all uuid in blockUUIDs is persisted
      window.logseq?.api?.set_blocks_id?.(blockUUIDs)
      const tasks = blockUUIDs.map(uuid => tryCreateLogseqPortalShapesFromUUID(`((${uuid}))`))
      const newShapes = (await Promise.all(tasks)).flat().filter(isNonNullable)
      return newShapes.map((s, idx) => {
        // if there are multiple shapes, shift them to the right
        return {
          ...s,
          // TODO: use better alignment?
          point: [point[0] + (LogseqPortalShape.defaultProps.size[0] + 16) * idx, point[1]],
        }
      })
    }
    return null
  }

  async function tryCreateShapeFromPageName(dataTransfer: DataTransfer) {
    // This is a Logseq custom data type defined in frontend.components.block
    const rawText = dataTransfer.getData('page-name')
    if (rawText) {
      const text = rawText.trim()

      return tryCreateLogseqPortalShapesFromUUID(`[[${text}]]`)
    }
    return null
  }

  async function tryCreateShapeFromTextPlain(item: DataTransfer | ClipboardItem) {
    const rawText = await getDataFromType(item, 'text/plain')
    if (rawText) {
      const text = rawText.trim()
      return tryCreateShapeHelper(tryCreateShapeFromURL, tryCreateShapeFromIframeString)(text)
    }

    return null
  }

  function tryCreateClonedShapesFromJSON(rawText: string) {
    const result = app.api.getClonedShapesFromTldrString(decodeURIComponent(rawText), point)
    if (result) {
      const { shapes, assets, bindings } = result
      assetsToClone.push(...assets)
      bindingsToCreate.push(...bindings)
      return shapes
    }
    return null
  }

  async function tryCreateShapeFromURL(rawText: string) {
    if (isValidURL(rawText) && !shiftKey) {
      if (YOUTUBE_REGEX.test(rawText)) {
        return [
          {
            ...YouTubeShape.defaultProps,
            url: rawText,
            point: [point[0], point[1]],
          },
        ]
      }

      if (TWITTER_REGEX.test(rawText)) {
        return [
          {
            ...TweetShape.defaultProps,
            url: rawText,
            point: [point[0], point[1]],
          },
        ]
      }

      return [
        {
          ...IFrameShape.defaultProps,
          url: rawText,
          point: [point[0], point[1]],
        },
      ]
    }
    return null
  }

  function tryCreateShapeFromIframeString(rawText: string) {
    // if rawText is iframe text
    if (rawText.startsWith('<iframe')) {
      return [
        {
          ...HTMLShape.defaultProps,
          html: rawText,
          point: [point[0], point[1]],
        },
      ]
    }
    return null
  }

  async function tryCreateLogseqPortalShapesFromUUID(rawText: string) {
    if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === NIL_UUID.length + 4) {
      const blockRef = rawText.slice(2, -2)
      if (validUUID(blockRef)) {
        return [
          {
            ...LogseqPortalShape.defaultProps,
            point: [point[0], point[1]],
            size: [400, 0], // use 0 here to enable auto-resize
            pageId: blockRef,
            fill: app.settings.color,
            stroke: app.settings.color,
            scaleLevel: app.settings.scaleLevel,
            blockType: 'B' as 'B',
          },
        ]
      }
    }
    // [[page name]] ?
    else if (/^\[\[.*\]\]$/.test(rawText)) {
      const pageName = rawText.slice(2, -2)
      return [
        {
          ...LogseqPortalShape.defaultProps,
          point: [point[0], point[1]],
          size: [400, 0], // use 0 here to enable auto-resize
          pageId: pageName,
          fill: app.settings.color,
          stroke: app.settings.color,
          scaleLevel: app.settings.scaleLevel,
          blockType: 'P' as 'P',
        },
      ]
    }

    return null
  }

  async function tryCreateLogseqPortalShapesFromString(item: DataTransfer | ClipboardItem) {
    const rawText = await getDataFromType(item, 'text/plain')
    if (rawText) {
      const text = rawText.trim()
      // Create a new block that belongs to the current whiteboard
      const uuid = handlers?.addNewBlock(text)
      if (uuid) {
        // create text shape
        return [
          {
            ...LogseqPortalShape.defaultProps,
            size: [400, 0], // use 0 here to enable auto-resize
            point: [point[0], point[1]],
            pageId: uuid,
            fill: app.settings.color,
            stroke: app.settings.color,
            scaleLevel: app.settings.scaleLevel,
            blockType: 'B' as 'B',
            compact: true,
          },
        ]
      }
    }

    return null
  }

  app.cursors.setCursor(TLCursor.Progress)

  let newShapes: TLShapeModel[] = []
  try {
    if (dataTransfer) {
      newShapes.push(...((await tryCreateShapesFromDataTransfer(dataTransfer)) ?? []))
    } else {
      // from Clipboard app or Shift copy etc
      // in this case, we do not have the dataTransfer object
      newShapes.push(...((await tryCreateShapesFromClipboard()) ?? []))
    }
  } catch (error) {
    console.error(error)
  }

  const allShapesToAdd: TLShapeModel<Shape['props']>[] = newShapes.map(shape => {
    return {
      ...shape,
      parentId: app.currentPageId,
      isLocked: false,
      id: validUUID(shape.id) ? shape.id : uniqueId(),
    }
  })

  const filesOnly = dataTransfer?.types.every(t => t === 'Files')

  app.wrapUpdate(() => {
    const allAssets = [...imageAssetsToCreate, ...assetsToClone]
    if (allAssets.length > 0) {
      app.createAssets(allAssets)
    }
    if (allShapesToAdd.length > 0) {
      app.createShapes(allShapesToAdd)
    }
    app.currentPage.updateBindings(Object.fromEntries(bindingsToCreate.map(b => [b.id, b])))

    if (app.selectedShapesArray.length === 1 && allShapesToAdd.length === 1 && fromDrop) {
      const source = app.selectedShapesArray[0]
      const target = app.getShapeById(allShapesToAdd[0].id!)!
      app.createNewLineBinding(source, target)
    }

    app.setSelectedShapes(allShapesToAdd.map(s => s.id))
    app.selectedTool.transition('idle') // clears possible editing states
    app.cursors.setCursor(TLCursor.Default)

    if (fromDrop || filesOnly) {
      app.packIntoRectangle()
    }
  })
}

// FIXME: for assets, we should prompt the user a loading spinner
export function usePaste() {
  const { handlers } = React.useContext(LogseqContext)

  return React.useCallback<TLReactCallbacks<Shape>['onPaste']>(async (app, info) => {
    // there is a special case for SHIFT+PASTE
    // it will set the link to the current selected shape

    if (info.shiftKey && app.selectedShapesArray.length === 1) {
      // TODO: thinking about how to make this more generic with usePaste hook
      // TODO: handle whiteboard shapes?
      const items = await navigator.clipboard.read()
      let newRef: string | undefined
      if (items.length > 0) {
        const blob = await items[0].getType('text/plain')
        const rawText = (await blob.text()).trim()

        if (rawText) {
          if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === NIL_UUID.length + 4) {
            const blockRef = rawText.slice(2, -2)
            if (validUUID(blockRef)) {
              newRef = blockRef
            }
          } else if (/^\[\[.*\]\]$/.test(rawText)) {
            newRef = rawText.slice(2, -2)
          }
        }
      }
      if (newRef) {
        app.selectedShapesArray[0].update({
          refs: [newRef],
        })
        app.persist()
        return
      }
      // fall through to creating shapes
    }

    handleCreatingShapes(app, info, handlers)
  }, [])
}
