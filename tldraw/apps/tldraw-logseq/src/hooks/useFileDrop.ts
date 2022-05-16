import { fileToBase64, getSizeFromSrc, TLAsset, uniqueId } from '@tldraw/core'
import type { TLReactCallbacks } from '@tldraw/react'
import * as React from 'react'
import type { Shape } from '~lib'

export function useFileDrop() {
  return React.useCallback<TLReactCallbacks<Shape>['onFileDrop']>(async (app, { files, point }) => {
    const IMAGE_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.gif']
    const assetId = uniqueId()
    interface ImageAsset extends TLAsset {
      size: number[]
    }
    const assetsToCreate: ImageAsset[] = []
    for (const file of files) {
      try {
        // Get extension, verify that it's an image
        const extensionMatch = file.name.match(/\.[0-9a-z]+$/i)
        if (!extensionMatch) throw Error('No extension.')
        const extension = extensionMatch[0].toLowerCase()
        if (!IMAGE_EXTENSIONS.includes(extension)) continue
        // Turn the image into a base64 dataurl
        const dataurl = await fileToBase64(file)
        if (typeof dataurl !== 'string') continue
        // Do we already have an asset for this image?
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
