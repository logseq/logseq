/* eslint-disable @typescript-eslint/no-explicit-any */
import { TLAsset, TLImageShape, TLImageShapeProps } from '@tldraw/core'
import { HTMLContainer, TLComponentProps } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { LogseqContext } from '../logseq-context'
import { BindingIndicator } from './BindingIndicator'

export interface ImageShapeProps extends TLImageShapeProps {
  type: 'image'
  assetId: string
  opacity: number
}

export class ImageShape extends TLImageShape<ImageShapeProps> {
  static id = 'image'

  static defaultProps: ImageShapeProps = {
    id: 'image1',
    parentId: 'page',
    type: 'image',
    point: [0, 0],
    size: [100, 100],
    opacity: 1,
    assetId: '',
    clipping: 0,
    objectFit: 'fill',
    isAspectRatioLocked: true,
  }

  ReactComponent = observer(({ events, isErasing, isBinding, asset }: TLComponentProps) => {
    const {
      props: {
        opacity,
        objectFit,
        clipping,
        size: [w, h],
      },
    } = this

    const [t, r, b, l] = Array.isArray(clipping)
      ? clipping
      : [clipping, clipping, clipping, clipping]

    const { handlers } = React.useContext(LogseqContext)

    return (
      <HTMLContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        {isBinding && <BindingIndicator mode="html" strokeWidth={4} size={[w, h]} />}

        <div data-asset-loaded={!!asset} className="tl-image-shape-container">
          {asset ? (
            <img
              src={handlers ? handlers.makeAssetUrl(asset.src) : asset.src}
              draggable={false}
              style={{
                position: 'relative',
                top: -t,
                left: -l,
                width: w + (l - r),
                height: h + (t - b),
                objectFit,
              }}
            />
          ) : (
            'Asset is missing'
          )}
        </div>
      </HTMLContainer>
    )
  })

  ReactIndicator = observer(() => {
    const {
      props: {
        size: [w, h],
        isLocked,
      },
    } = this
    return (
      <rect
        width={w}
        height={h}
        fill="transparent"
        strokeDasharray={isLocked ? '8 2' : 'undefined'}
      />
    )
  })

  getShapeSVGJsx({ assets }: { assets: TLAsset[] }) {
    // Do not need to consider the original point here
    const bounds = this.getBounds()
    const {
      assetId,
      clipping,
      size: [w, h],
    } = this.props
    const asset = assets.find(ass => ass.id === assetId)

    if (asset) {
      // TODO: add clipping
      const [t, r, b, l] = Array.isArray(clipping)
        ? clipping
        : [clipping, clipping, clipping, clipping]

      const make_asset_url = window.logseq?.api?.make_asset_url

      return (
        <image
          width={bounds.width}
          height={bounds.height}
          href={make_asset_url ? make_asset_url(asset.src) : asset.src}
        />
      )
    } else {
      return super.getShapeSVGJsx({})
    }
  }
}
