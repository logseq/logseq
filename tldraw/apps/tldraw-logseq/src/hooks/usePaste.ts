import {
  BoundsUtils,
  getSizeFromSrc,
  isNonNullable,
  TLAsset,
  TLBinding,
  TLCursor,
  TLShapeModel,
  uniqueId,
  validUUID,
} from '@tldraw/core'
import type { TLReactCallbacks } from '@tldraw/react'
import Vec from '@tldraw/vec'
import * as React from 'react'
import { NIL as NIL_UUID } from 'uuid'
import {
  HTMLShape,
  IFrameShape,
  ImageShape,
  LogseqPortalShape,
  VideoShape,
  YouTubeShape,
  type Shape,
} from '../lib'
import { LogseqContext } from '../lib/logseq-context'

const isValidURL = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const safeParseJson = (json: string) => {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

interface VideoImageAsset extends TLAsset {
  size?: number[]
}

const IMAGE_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.gif']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg']

function getFileType(filename: string) {
  // Get extension, verify that it's an image
  const extensionMatch = filename.match(/\.[0-9a-z]+$/i)
  if (!extensionMatch) {
    return 'unknown'
  }
  const extension = extensionMatch[0].toLowerCase()
  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image'
  }
  if (VIDEO_EXTENSIONS.includes(extension)) {
    return 'video'
  }
  return 'unknown'
}

type MaybeShapes = Shape['props'][] | null | undefined

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

// FIXME: for assets, we should prompt the user a loading spinner
export function usePaste() {
  const { handlers } = React.useContext(LogseqContext)

  return React.useCallback<TLReactCallbacks<Shape>['onPaste']>(
    async (app, { point, shiftKey, dataTransfer, fromDrop }) => {
      let imageAssetsToCreate: VideoImageAsset[] = []
      let assetsToClone: TLAsset[] = []
      const bindingsToCreate: TLBinding[] = []

      async function createAssetsFromURL(url: string, isVideo: boolean): Promise<VideoImageAsset> {
        // Do we already have an asset for this image?
        const existingAsset = Object.values(app.assets).find(asset => asset.src === url)
        if (existingAsset) {
          return existingAsset as VideoImageAsset
        } else {
          // Create a new asset for this image
          const asset: VideoImageAsset = {
            id: uniqueId(),
            type: isVideo ? 'video' : 'image',
            src: url,
            size: await getSizeFromSrc(handlers.makeAssetUrl(url), isVideo),
          }
          return asset
        }
      }

      async function createAssetsFromFiles(files: File[]) {
        const tasks = files
          .filter(file => getFileType(file.name) !== 'unknown')
          .map(async file => {
            try {
              const dataurl = await handlers.saveAsset(file)
              return await createAssetsFromURL(dataurl, getFileType(file.name) === 'video')
            } catch (err) {
              console.error(err)
            }
            return null
          })
        return (await Promise.all(tasks)).filter(isNonNullable)
      }

      function createHTMLShape(text: string) {
        return {
          ...HTMLShape.defaultProps,
          html: text,
          point: [point[0], point[1]],
        }
      }

      async function tryCreateShapesFromDataTransfer(dataTransfer: DataTransfer) {
        return tryCreateShapeHelper(
          tryCreateShapeFromFiles,
          tryCreateShapeFromTextHTML,
          tryCreateShapeFromTextPlain,
          tryCreateShapeFromBlockUUID
        )(dataTransfer)
      }

      async function tryCreateShapesFromClipboard() {
        const items = await navigator.clipboard.read()
        const createShapesFn = tryCreateShapeHelper(
          tryCreateShapeFromTextHTML,
          tryCreateShapeFromTextPlain
        )
        const allShapes = (await Promise.all(items.map(item => createShapesFn(item))))
          .flat()
          .filter(isNonNullable)

        return allShapes
      }

      async function tryCreateShapeFromFiles(item: DataTransfer) {
        const files = Array.from(item.files)
        if (files.length > 0) {
          const assets = await createAssetsFromFiles(files)
          // ? could we get rid of this side effect?
          imageAssetsToCreate = assets

          return assets.map((asset, i) => {
            const defaultProps =
              asset.type === 'video' ? VideoShape.defaultProps : ImageShape.defaultProps
            const newShape = {
              ...defaultProps,
              // TODO: Should be place near the last edited shape
              assetId: asset.id,
              opacity: 1,
            }

            if (asset.size) {
              Object.assign(newShape, {
                point: [
                  point[0] - asset.size[0] / 4 + i * 16,
                  point[1] - asset.size[1] / 4 + i * 16,
                ],
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
          return [createHTMLShape(rawText)]
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
          const tasks = blockUUIDs.map(uuid => tryCreateLogseqPortalShapesFromString(`((${uuid}))`))
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

      async function tryCreateShapeFromTextPlain(item: DataTransfer | ClipboardItem) {
        const rawText = await getDataFromType(item, 'text/plain')
        if (rawText) {
          const text = rawText.trim()
          return tryCreateShapeHelper(
            tryCreateShapeFromURL,
            tryCreateShapeFromIframeString,
            tryCreateClonedShapesFromJSON,
            tryCreateLogseqPortalShapesFromString
          )(text)
        }

        return null
      }

      function tryCreateClonedShapesFromJSON(rawText: string) {
        const data = safeParseJson(rawText)
        try {
          if (data?.type === 'logseq/whiteboard-shapes') {
            const shapes = data.shapes as TLShapeModel[]
            assetsToClone = data.assets as TLAsset[]
            const commonBounds = BoundsUtils.getCommonBounds(
              shapes.map(shape => ({
                minX: shape.point?.[0] ?? point[0],
                minY: shape.point?.[1] ?? point[1],
                width: shape.size?.[0] ?? 4,
                height: shape.size?.[1] ?? 4,
                maxX: (shape.point?.[0] ?? point[0]) + (shape.size?.[0] ?? 4),
                maxY: (shape.point?.[1] ?? point[1]) + (shape.size?.[1] ?? 4),
              }))
            )
            const shapesToCreate = shapes.map(shape => {
              return {
                ...shape,
                id: uniqueId(),
                point: [
                  point[0] + shape.point![0] - commonBounds.minX,
                  point[1] + shape.point![1] - commonBounds.minY,
                ],
              }
            })

            // Try to rebinding the shapes to the new assets
            shapesToCreate
              .flatMap(s => Object.values(s.handles ?? {}))
              .forEach(h => {
                if (!h.bindingId) {
                  return
                }
                // try to bind the new shape
                const binding = app.currentPage.bindings[h.bindingId]
                // FIXME: if copy from a different whiteboard, the binding info
                // will not be available
                if (binding) {
                  // if the copied binding from/to is in the source
                  const oldFromIdx = shapes.findIndex(s => s.id === binding.fromId)
                  const oldToIdx = shapes.findIndex(s => s.id === binding.toId)
                  if (binding && oldFromIdx !== -1 && oldToIdx !== -1) {
                    const newBinding: TLBinding = {
                      ...binding,
                      id: uniqueId(),
                      fromId: shapesToCreate[oldFromIdx].id,
                      toId: shapesToCreate[oldToIdx].id,
                    }
                    bindingsToCreate.push(newBinding)
                    h.bindingId = newBinding.id
                  } else {
                    h.bindingId = undefined
                  }
                } else {
                  console.warn('binding not found', h.bindingId)
                }
              })

            return shapesToCreate as Shape['props'][]
          }
        } catch (err) {
          console.error(err)
        }
        return null
      }

      async function tryCreateShapeFromURL(rawText: string) {
        if (isValidURL(rawText)) {
          const isYoutubeUrl = (url: string) => {
            const youtubeRegex =
              /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
            return youtubeRegex.test(url)
          }
          if (isYoutubeUrl(rawText)) {
            return [
              {
                ...YouTubeShape.defaultProps,
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

      async function tryCreateLogseqPortalShapesFromString(rawText: string) {
        if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === NIL_UUID.length + 4) {
          const blockRef = rawText.slice(2, -2)
          if (validUUID(blockRef)) {
            return [
              {
                ...LogseqPortalShape.defaultProps,
                point: [point[0], point[1]],
                size: [400, 0], // use 0 here to enable auto-resize
                pageId: blockRef,
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
              blockType: 'P' as 'P',
            },
          ]
        }

        // Otherwise, creating a new block that belongs to the current whiteboard
        const uuid = handlers?.addNewBlock(rawText)
        if (uuid) {
          // create text shape
          return [
            {
              ...LogseqPortalShape.defaultProps,
              size: [400, 0], // use 0 here to enable auto-resize
              point: [point[0], point[1]],
              pageId: uuid,
              blockType: 'B' as 'B',
              compact: true,
            },
          ]
        }

        return null
      }

      app.cursors.setCursor(TLCursor.Progress)

      let newShapes: Shape['props'][] = []
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

      const allShapesToAdd: TLShapeModel[] = newShapes.map(shape => {
        return {
          ...shape,
          parentId: app.currentPageId,
          id: validUUID(shape.id) ? shape.id : uniqueId(),
        }
      })

      app.wrapUpdate(() => {
        const allAssets = [...imageAssetsToCreate, ...assetsToClone]
        if (allAssets.length > 0) {
          app.createAssets(allAssets)
        }
        if (allShapesToAdd.length > 0) {
          app.createShapes(allShapesToAdd)
        }

        if (app.selectedShapesArray.length === 1 && allShapesToAdd.length === 1) {
          const source = app.selectedShapesArray[0]
          const target = app.getShapeById(allShapesToAdd[0].id!)!
          app.createNewLineBinding(source, target)
        }

        app.currentPage.updateBindings(Object.fromEntries(bindingsToCreate.map(b => [b.id, b])))
        app.setSelectedShapes(allShapesToAdd.map(s => s.id))
        app.selectedTool.transition('idle') // clears possible editing states
        app.cursors.setCursor(TLCursor.Default)
      })
    },
    []
  )
}
