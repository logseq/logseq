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
async function tryCreateShapeHelper<Args extends any[]>(fns: CreateShapeFN<Args>[], ...args: Args) {
  for (const fn of fns) {
    const result = await fn(...(args as any))
    if (result && result.length > 0) {
      return result
    }
  }
  return null
}

// FIXME: for assets, we should prompt the user a loading spinner
export function usePaste() {
  const { handlers } = React.useContext(LogseqContext)

  return React.useCallback<TLReactCallbacks<Shape>['onPaste']>(
    async (app, { point, shiftKey, dataTransfer }) => {
      let imageAssetsToCreate: VideoImageAsset[] = []
      let assetsToClone: TLAsset[] = []
      const shapesToCreate: Shape['props'][] = []
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

      // async function handleItems(items: any) {
      //   for (const item of items) {
      //     if (await handleDroppedItem(item)) {
      //       const lineId = uniqueId()

      //       const startBinding: TLBinding = {
      //         id: uniqueId(),
      //         distance: 200,
      //         handleId: 'start',
      //         fromId: lineId,
      //         toId: app.selectedShapesArray[app.selectedShapesArray.length - 1].id,
      //         point: [point[0], point[1]],
      //       }
      //       bindingsToCreate.push(startBinding)

      //       const endBinding: TLBinding = {
      //         id: uniqueId(),
      //         distance: 200,
      //         handleId: 'end',
      //         fromId: lineId,
      //         toId: shapesToCreate[shapesToCreate.length - 1].id,
      //         point: [point[0], point[1]],
      //       }
      //       bindingsToCreate.push(endBinding)

      //       shapesToCreate.push({
      //         ...LineShape.defaultProps,
      //         id: lineId,
      //         handles: {
      //           start: {
      //             id: 'start',
      //             canBind: true,
      //             point: app.selectedShapesArray[0].getCenter(),
      //             bindingId: startBinding.id,
      //           },
      //           end: {
      //             id: 'end',
      //             canBind: true,
      //             point: [point[0], point[1]],
      //             bindingId: endBinding.id,
      //           },
      //         },
      //       })

      //       return true
      //     }
      //   }
      //   return false
      // }

      async function tryCreateShapesFromDataTransfer(dataTransfer: DataTransfer) {
        return tryCreateShapeHelper(
          [tryCreateShapeFromFiles, tryCreateShapeFromTextHTML, tryCreateShapeFromTextPlain],
          dataTransfer
        )
      }

      async function tryCreateShapeFromFiles(dataTransfer: DataTransfer) {
        const files = Array.from(dataTransfer.files)
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

      function tryCreateShapeFromTextHTML(dataTransfer: DataTransfer) {
        if (dataTransfer.types.includes('text/html') && !shiftKey) {
          const html = dataTransfer.getData('text/html')

          if (html) {
            return [createHTMLShape(html)]
          }
        }
        return null
      }

      async function tryCreateShapeFromTextPlain(dataTransfer: DataTransfer) {
        if (dataTransfer.types.includes('text/plain')) {
          const text = dataTransfer.getData('text/plain').trim()

          return tryCreateShapeHelper(
            [
              tryCreateShapeFromURL,
              tryCreateShapeFromIframeString,
              tryCreateClonedShapesFromJSON,
              tryCreateLogseqPortalShapesFromString,
            ],
            text
          )
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
              id: uniqueId(),
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

      try {
        const shapesFromDataTransfer = dataTransfer
          ? await tryCreateShapesFromDataTransfer(dataTransfer)
          : null
        if (shapesFromDataTransfer) {
          shapesToCreate.push(...shapesFromDataTransfer)
        } else {
          // from Clipboard app or Shift copy etc
          // in this case, we do not have the dataTransfer object
        }
      } catch (error) {
        console.error(error)
      }

      console.log(bindingsToCreate)

      const allShapesToAdd: TLShapeModel[] = shapesToCreate.map(shape => {
        return {
          ...shape,
          parentId: app.currentPageId,
          id: uniqueId(),
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
        app.currentPage.updateBindings(Object.fromEntries(bindingsToCreate.map(b => [b.id, b])))
        app.setSelectedShapes(allShapesToAdd.map(s => s.id))
      })
      app.cursors.setCursor(TLCursor.Default)
    },
    []
  )
}
