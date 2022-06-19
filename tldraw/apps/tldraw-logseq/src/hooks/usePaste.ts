import { fileToBase64, getSizeFromSrc, TLAsset, uniqueId } from '@tldraw/core'
import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '~lib'

export function usePaste() {
  return React.useCallback<TLReactCallbacks<Shape>['onFileDrop']>(async (app, { point }) => {
    const assetId = uniqueId()
    interface ImageAsset extends TLAsset {
      size: number[]
    }

    // TODO: supporting other pasting formats
    const assetsToCreate: ImageAsset[] = []
    for (const item of await navigator.clipboard.read()) {
      try {
        const firstImageType = item.types.find(type => type.startsWith('image'))
        if (firstImageType) {
          const blob = await item.getType(firstImageType)
          const dataurl = await fileToBase64(blob)
          if (typeof dataurl !== 'string') continue
          const existingAsset = Object.values(app.assets).find(asset => asset.src === dataurl)
          if (existingAsset) {
            assetsToCreate.push(existingAsset as ImageAsset)
            continue
          }
          // Create a new asset for this image
          const asset: ImageAsset = {
            id: assetId,
            type: 'image',
            src: dataurl,
            size: await getSizeFromSrc(dataurl),
          }
          assetsToCreate.push(asset)
        }
      } catch (error) {
        console.error(error)
      }
    }

    app.createAssets(assetsToCreate)
    app.createShapes(
      assetsToCreate.map((asset, i) => ({
        id: uniqueId(),
        type: 'image',
        parentId: app.currentPageId,
        point: [point[0] - asset.size[0] / 2 + i * 16, point[1] - asset.size[1] / 2 + i * 16],
        size: asset.size,
        assetId: asset.id,
        opacity: 1,
      }))
    )
  }, [])
}
