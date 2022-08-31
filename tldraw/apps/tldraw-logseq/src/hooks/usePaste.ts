import {
  BoundsUtils,
  getSizeFromSrc,
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
  type Shape,
  HTMLShape,
  YouTubeShape,
  LogseqPortalShape,
  VideoShape,
  ImageShape,
} from '../lib'
import type { LogseqContextValue } from '../lib/logseq-context'

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

const IMAGE_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.gif']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg']

// FIXME: for assets, we should prompt the user a loading spinner
export function usePaste(context: LogseqContextValue) {
  const { handlers } = context

  return React.useCallback<TLReactCallbacks<Shape>['onPaste']>(
    async (app, { point, shiftKey, files }) => {
      interface VideoImageAsset extends TLAsset {
        size: number[]
      }

      const imageAssetsToCreate: VideoImageAsset[] = []
      let assetsToClone: TLAsset[] = []
      const shapesToCreate: Shape['props'][] = []
      const bindingsToCreate: TLBinding[] = []

      async function createAsset(file: File): Promise<string | null> {
        return await handlers.saveAsset(file)
      }

      async function handleAssetUrl(url: string, isVideo: boolean) {
        // Do we already have an asset for this image?
        const existingAsset = Object.values(app.assets).find(asset => asset.src === url)
        if (existingAsset) {
          imageAssetsToCreate.push(existingAsset as VideoImageAsset)
          return true
        } else {
          try {
            // Create a new asset for this image
            const asset: VideoImageAsset = {
              id: uniqueId(),
              type: isVideo ? 'video' : 'image',
              src: url,
              size: await getSizeFromSrc(handlers.makeAssetUrl(url), isVideo),
            }
            imageAssetsToCreate.push(asset)
            return true
          } catch {
            return false
          }
        }
      }

      // TODO: handle PDF?
      async function handleFiles(files: File[]) {
        let added = false
        for (const file of files) {
          // Get extension, verify that it's an image
          const extensionMatch = file.name.match(/\.[0-9a-z]+$/i)
          if (!extensionMatch) {
            continue
          }
          const extension = extensionMatch[0].toLowerCase()
          if (![...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(extension)) {
            continue
          }
          const isVideo = VIDEO_EXTENSIONS.includes(extension)
          try {
            // Turn the image into a base64 dataurl
            const dataurl = await createAsset(file)
            if (!dataurl) {
              continue
            }
            if (await handleAssetUrl(dataurl, isVideo)) {
              added = true
            }
          } catch (error) {
            console.error(error)
          }
        }
        return added
      }

      async function handleHTML(item: ClipboardItem) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html')
          const rawText = (await blob.text()).trim()

          shapesToCreate.push({
            ...HTMLShape.defaultProps,
            html: rawText,
            point: [point[0], point[1]],
          })
          return true
        }
        return false
      }

      async function handleTextPlain(item: ClipboardItem) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain')
          const rawText = (await blob.text()).trim()

          if (await handleURL(rawText)) {
            return true
          }

          if (handleIframe(rawText)) {
            return true
          }

          if (handleTldrawShapes(rawText)) {
            return true
          }
          if (await handleLogseqPortalShapes(rawText)) {
            return true
          }
        }

        return false
      }

      function handleTldrawShapes(rawText: string) {
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
            const clonedShapes = shapes.map(shape => {
              return {
                ...shape,
                point: [
                  point[0] + shape.point![0] - commonBounds.minX,
                  point[1] + shape.point![1] - commonBounds.minY,
                ],
              }
            })
            // @ts-expect-error - This is a valid shape
            shapesToCreate.push(...clonedShapes)

            // Try to rebinding the shapes to the new assets
            shapesToCreate.forEach((s, idx) => {
              if (s.handles) {
                Object.values(s.handles).forEach(h => {
                  if (h.bindingId) {
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
                    }
                  }
                })
              }
            })

            return true
          }
        } catch (err) {
          console.error(err)
        }
        return false
      }

      async function handleURL(rawText: string) {
        if (isValidURL(rawText)) {
          const isYoutubeUrl = (url: string) => {
            const youtubeRegex =
              /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
            return youtubeRegex.test(url)
          }
          if (isYoutubeUrl(rawText)) {
            shapesToCreate.push({
              ...YouTubeShape.defaultProps,
              url: rawText,
              point: [point[0], point[1]],
            })
            return true
          }
          const extension = rawText.match(/\.[0-9a-z]+$/i)?.[0].toLowerCase()
          if (
            extension &&
            [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(extension) &&
            (await handleAssetUrl(rawText, VIDEO_EXTENSIONS.includes(extension)))
          ) {
            return true
          }
          // ??? deal with normal URLs?
        }
        return false
      }

      function handleIframe(rawText: string) {
        // if rawText is iframe text
        if (rawText.startsWith('<iframe')) {
          shapesToCreate.push({
            ...HTMLShape.defaultProps,
            html: rawText,
            point: [point[0], point[1]],
          })
          return true
        }
        return false
      }

      async function handleLogseqPortalShapes(rawText: string) {
        if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === NIL_UUID.length + 4) {
          const blockRef = rawText.slice(2, -2)
          if (validUUID(blockRef)) {
            shapesToCreate.push({
              ...LogseqPortalShape.defaultProps,
              point: [point[0], point[1]],
              size: [400, 0], // use 0 here to enable auto-resize
              pageId: blockRef,
              blockType: 'B',
            })
            return true
          }
        } else if (/^\[\[.*\]\]$/.test(rawText)) {
          const pageName = rawText.slice(2, -2)
          shapesToCreate.push({
            ...LogseqPortalShape.defaultProps,
            point: [point[0], point[1]],
            size: [400, 0], // use 0 here to enable auto-resize
            pageId: pageName,
            blockType: 'P',
          })
          return true
        }

        const uuid = handlers?.addNewBlock(rawText)
        if (uuid) {
          // create text shape
          shapesToCreate.push({
            ...LogseqPortalShape.defaultProps,
            id: uniqueId(),
            size: [400, 0], // use 0 here to enable auto-resize
            point: [point[0], point[1]],
            pageId: uuid,
            blockType: 'B',
            compact: true,
          })
          return true
        }
        return false
      }

      app.cursors.setCursor(TLCursor.Progress)

      try {
        if (files && files.length > 0) {
          await handleFiles(files)
        } else {
          for (const item of await navigator.clipboard.read()) {
            let handled = !shiftKey ? await handleHTML(item) : false
            if (!handled) {
              await handleTextPlain(item)
            }
          }
        }
      } catch (error) {
        console.error(error)
      }

      const allShapesToAdd: TLShapeModel[] = [
        // assets to images
        ...imageAssetsToCreate.map((asset, i) => ({
          ...(asset.type === 'video' ? VideoShape : ImageShape).defaultProps,
          // TODO: Should be place near the last edited shape
          point: [point[0] - asset.size[0] / 4 + i * 16, point[1] - asset.size[1] / 4 + i * 16],
          size: Vec.div(asset.size, 2),
          assetId: asset.id,
          opacity: 1,
        })),
        ...shapesToCreate,
      ].map(shape => {
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
