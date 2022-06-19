import {
  BoundsUtils,
  fileToBase64,
  getSizeFromSrc,
  TLAsset,
  TLShapeModel,
  uniqueId,
} from '@tldraw/core'
import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '~lib'

export function usePaste() {
  return React.useCallback<TLReactCallbacks<Shape>['onFileDrop']>(async (app, { point }) => {
    const assetId = uniqueId()
    interface ImageAsset extends TLAsset {
      size: number[]
    }

    const assetsToCreate: ImageAsset[] = []
    const shapesToCreate: TLShapeModel[] = []

    async function handleImage(item: ClipboardItem) {
      const firstImageType = item.types.find(type => type.startsWith('image'))
      if (firstImageType) {
        const blob = await item.getType(firstImageType)
        const dataurl = await fileToBase64(blob)
        if (typeof dataurl !== 'string') return false
        const existingAsset = Object.values(app.assets).find(asset => asset.src === dataurl)
        if (existingAsset) {
          assetsToCreate.push(existingAsset as ImageAsset)
          return false
        }
        // Create a new asset for this image
        const asset: ImageAsset = {
          id: assetId,
          type: 'image',
          src: dataurl,
          size: await getSizeFromSrc(dataurl),
        }
        assetsToCreate.push(asset)
        return true
      }
      return false
    }

    async function handleLogseqShapes(item: ClipboardItem) {
      const plainTextType = item.types.find(type => type.startsWith('text/plain'))
      if (plainTextType) {
        const blob = await item.getType(plainTextType)
        const rawText = await blob.text()
        const data = JSON.parse(rawText)
        if (data.type === 'logseq/whiteboard-shapes') {
          const shapes = data.shapes as TLShapeModel[]
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
          const clonedShape = data.shapes.map((shape: TLShapeModel) => {
            return {
              ...shape,
              handles: {}, // TODO: may add this later?
              id: uniqueId(),
              parentId: app.currentPageId,
              point: [
                point[0] + shape.point![0] - commonBounds.minX,
                point[1] + shape.point![1] - commonBounds.minY,
              ],
            }
          })
          shapesToCreate.push(...clonedShape)
        }
      }
    }

    // TODO: supporting other pasting formats
    for (const item of await navigator.clipboard.read()) {
      try {
        let handled = await handleImage(item)
        if (!handled) {
          await handleLogseqShapes(item)
        }
      } catch (error) {
        console.error(error)
      }
    }

    const allShapesToAdd = [
      ...assetsToCreate.map((asset, i) => ({
        id: uniqueId(),
        type: 'image',
        parentId: app.currentPageId,
        point: [point[0] - asset.size[0] / 2 + i * 16, point[1] - asset.size[1] / 2 + i * 16],
        size: asset.size,
        assetId: asset.id,
        opacity: 1,
      })),
      ...shapesToCreate,
    ]

    app.createAssets(assetsToCreate)
    app.createShapes(allShapesToAdd)

    app.setSelectedShapes(allShapesToAdd.map(s => s.id))
  }, [])
}
