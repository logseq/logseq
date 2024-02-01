import { Decoration, isNonNullable } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import type {
  BoxShape,
  EllipseShape,
  HTMLShape,
  IFrameShape,
  LineShape,
  LogseqPortalShape,
  PencilShape,
  PolygonShape,
  Shape,
  TextShape,
  YouTubeShape,
  TweetShape,
} from '../../lib'
import { Button } from '../Button'
import { TablerIcon } from '../icons'
import { ColorInput } from '../inputs/ColorInput'
import { ScaleInput } from '../inputs/ScaleInput'
import { ShapeLinksInput } from '../inputs/ShapeLinksInput'
import { TextInput } from '../inputs/TextInput'
import {
  ToggleGroupInput,
  ToggleGroupMultipleInput,
  type ToggleGroupInputOption,
} from '../inputs/ToggleGroupInput'
import { ToggleInput } from '../inputs/ToggleInput'
import { GeometryTools } from '../GeometryTools'
import { LogseqContext } from '../../lib/logseq-context'
import { KeyboardShortcut } from '../KeyboardShortcut'

export const contextBarActionTypes = [
  // Order matters
  'EditPdf',
  'LogseqPortalViewMode',
  'Geometry',
  'AutoResizing',
  'Swatch',
  'NoFill',
  'StrokeType',
  'ScaleLevel',
  'TextStyle',
  'YoutubeLink',
  'TwitterLink',
  'IFrameSource',
  'ArrowMode',
  'Links',
] as const

type ContextBarActionType = typeof contextBarActionTypes[number]
const singleShapeActions: ContextBarActionType[] = [
  'YoutubeLink',
  'TwitterLink',
  'IFrameSource',
  'Links',
  'EditPdf',
]

const contextBarActionMapping = new Map<ContextBarActionType, React.FC>()

type ShapeType = Shape['props']['type']

export const shapeMapping: Record<ShapeType, ContextBarActionType[]> = {
  'logseq-portal': ['Swatch', 'LogseqPortalViewMode', 'ScaleLevel', 'AutoResizing', 'Links'],
  youtube: ['YoutubeLink', 'Links'],
  tweet: ['TwitterLink', 'Links'],
  iframe: ['IFrameSource', 'Links'],
  box: ['Geometry', 'TextStyle', 'Swatch', 'ScaleLevel', 'NoFill', 'StrokeType', 'Links'],
  ellipse: ['Geometry', 'TextStyle', 'Swatch', 'ScaleLevel', 'NoFill', 'StrokeType', 'Links'],
  polygon: ['Geometry', 'TextStyle', 'Swatch', 'ScaleLevel', 'NoFill', 'StrokeType', 'Links'],
  line: ['TextStyle', 'Swatch', 'ScaleLevel', 'ArrowMode', 'Links'],
  pencil: ['Swatch', 'Links', 'ScaleLevel'],
  highlighter: ['Swatch', 'Links', 'ScaleLevel'],
  text: ['TextStyle', 'Swatch', 'ScaleLevel', 'AutoResizing', 'Links'],
  html: ['ScaleLevel', 'AutoResizing', 'Links'],
  image: ['Links'],
  video: ['Links'],
  pdf: ['EditPdf', 'Links'],
}

export const withFillShapes = Object.entries(shapeMapping)
  .filter(([key, types]) => {
    return types.includes('NoFill') && types.includes('Swatch')
  })
  .map(([key]) => key) as ShapeType[]

function filterShapeByAction<S extends Shape>(type: ContextBarActionType) {
  const app = useApp<Shape>()
  const unlockedSelectedShapes = app.selectedShapesArray.filter(s => !s.props.isLocked)
  return unlockedSelectedShapes.filter(shape => shapeMapping[shape.props.type]?.includes(type))
}

const AutoResizingAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<LogseqPortalShape | TextShape | HTMLShape>('AutoResizing')

  const pressed = shapes.every(s => s.props.isAutoResizing)

  return (
    <ToggleInput
      tooltip={t('whiteboard/auto-resize')}
      toggle={shapes.every(s => s.props.type === 'logseq-portal')}
      className="tl-button"
      pressed={pressed}
      onPressedChange={v => {
        shapes.forEach(s => {
          if (s.props.type === 'logseq-portal') {
            s.update({
              isAutoResizing: v,
            })
          } else {
            s.onResetBounds({ zoom: app.viewport.camera.zoom })
          }
        })
        app.persist()
      }}
    >
      <TablerIcon name="dimensions" />
    </ToggleInput>
  )
})

const LogseqPortalViewModeAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<LogseqPortalShape>('LogseqPortalViewMode')

  const collapsed = shapes.every(s => s.collapsed)
  if (!collapsed && !shapes.every(s => !s.collapsed)) {
    return null
  }

  const tooltip = (
    <div className="flex">
      {collapsed ? t('whiteboard/expand') : t('whiteboard/collapse')}
      <KeyboardShortcut
        action={collapsed ? 'editor/expand-block-children' : 'editor/collapse-block-children'}
      />
    </div>
  )

  return (
    <ToggleInput
      tooltip={tooltip}
      toggle={shapes.every(s => s.props.type === 'logseq-portal')}
      className="tl-button"
      pressed={collapsed}
      onPressedChange={() => app.api.setCollapsed(!collapsed)}
    >
      <TablerIcon name={collapsed ? 'object-expanded' : 'object-compact'} />
    </ToggleInput>
  )
})

const ScaleLevelAction = observer(() => {
  const {
    handlers: { isMobile },
  } = React.useContext(LogseqContext)

  const shapes = filterShapeByAction<LogseqPortalShape>('ScaleLevel')
  const scaleLevel = new Set(shapes.map(s => s.scaleLevel)).size > 1 ? '' : shapes[0].scaleLevel

  return <ScaleInput scaleLevel={scaleLevel} compact={isMobile()} />
})

const IFrameSourceAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shape = filterShapeByAction<IFrameShape>('IFrameSource')[0]

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shape.onIFrameSourceChange(e.target.value.trim().toLowerCase())
    app.persist()
  }, [])

  const handleReload = React.useCallback(() => {
    shape.reload()
  }, [])

  return (
    <span className="flex gap-3">
      <Button tooltip={t('whiteboard/reload')} type="button" onClick={handleReload}>
        <TablerIcon name="refresh" />
      </Button>
      <TextInput
        title={t('whiteboard/website-url')}
        className="tl-iframe-src"
        value={`${shape.props.url}`}
        onChange={handleChange}
      />
      <Button
        tooltip={t('whiteboard/open-website-url')}
        type="button"
        onClick={() => window.open(shape.props.url)}
      >
        <TablerIcon name="external-link" />
      </Button>
    </span>
  )
})

const YoutubeLinkAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shape = filterShapeByAction<YouTubeShape>('YoutubeLink')[0]
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shape.onYoutubeLinkChange(e.target.value)
    app.persist()
  }, [])

  return (
    <span className="flex gap-3">
      <TextInput
        title={t('whiteboard/youtube-url')}
        className="tl-youtube-link"
        value={`${shape.props.url}`}
        onChange={handleChange}
      />
      <Button
        tooltip={t('whiteboard/open-youtube-url')}
        type="button"
        onClick={() => window.logseq?.api?.open_external_link?.(shape.props.url)}
      >
        <TablerIcon name="external-link" />
      </Button>
    </span>
  )
})

const TwitterLinkAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shape = filterShapeByAction<TweetShape>('TwitterLink')[0]
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shape.onTwitterLinkChange(e.target.value)
    app.persist()
  }, [])

  return (
    <span className="flex gap-3">
      <TextInput
        title={t('whiteboard/twitter-url')}
        className="tl-twitter-link"
        value={`${shape.props.url}`}
        onChange={handleChange}
      />
      <Button
        tooltip={t('whiteboard/open-twitter-url')}
        type="button"
        onClick={() => window.logseq?.api?.open_external_link?.(shape.props.url)}
      >
        <TablerIcon name="external-link" />
      </Button>
    </span>
  )
})

const EditPdfAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t, setCurrentPdf },
  } = React.useContext(LogseqContext)
  const shape = app.selectedShapesArray[0]

  return (
    <Button
      tooltip={t('whiteboard/edit-pdf')}
      type="button"
      onClick={() => setCurrentPdf(app.assets[shape.props.assetId].src)}
    >
      <TablerIcon name="edit" />
    </Button>
  )
})

const NoFillAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<BoxShape | PolygonShape | EllipseShape>('NoFill')
  const handleChange = React.useCallback((v: boolean) => {
    app.selectedShapesArray.forEach(s => s.update({ noFill: v }))
    app.persist()
  }, [])

  const noFill = shapes.every(s => s.props.noFill)

  return (
    <ToggleInput
      tooltip={t('whiteboard/fill')}
      className="tl-button"
      pressed={noFill}
      onPressedChange={handleChange}
    >
      <TablerIcon name={noFill ? 'droplet-off' : 'droplet'} />
    </ToggleInput>
  )
})

const SwatchAction = observer(() => {
  const app = useApp<Shape>()
  // Placeholder
  const shapes = filterShapeByAction<
    BoxShape | PolygonShape | EllipseShape | LineShape | PencilShape | TextShape
  >('Swatch')

  const handleSetColor = React.useCallback((color: string) => {
    app.selectedShapesArray.forEach(s => {
      s.update({ fill: color, stroke: color })
    })
    app.persist()
  }, [])

  const handleSetOpacity = React.useCallback((opacity: number) => {
    app.selectedShapesArray.forEach(s => {
      s.update({ opacity: opacity })
    })
    app.persist()
  }, [])

  const color = shapes[0].props.noFill ? shapes[0].props.stroke : shapes[0].props.fill
  return (
    <ColorInput
      popoverSide="top"
      color={color}
      opacity={shapes[0].props.opacity}
      setOpacity={handleSetOpacity}
      setColor={handleSetColor}
    />
  )
})

const GeometryAction = observer(() => {
  const app = useApp<Shape>()

  const handleSetGeometry = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const type = e.currentTarget.dataset.tool
    app.api.convertShapes(type)
  }, [])

  return <GeometryTools popoverSide="top" chevron={false} setGeometry={handleSetGeometry} />
})

const StrokeTypeAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<
    BoxShape | PolygonShape | EllipseShape | LineShape | PencilShape
  >('StrokeType')

  const StrokeTypeOptions: ToggleGroupInputOption[] = [
    {
      value: 'line',
      icon: 'circle',
      tooltip: 'Solid',
    },
    {
      value: 'dashed',
      icon: 'circle-dashed',
      tooltip: 'Dashed',
    },
  ]

  const value = shapes.every(s => s.props.strokeType === 'dashed')
    ? 'dashed'
    : shapes.every(s => s.props.strokeType === 'line')
    ? 'line'
    : 'mixed'

  return (
    <ToggleGroupInput
      title={t('whiteboard/stroke-type')}
      options={StrokeTypeOptions}
      value={value}
      onValueChange={v => {
        shapes.forEach(shape => {
          shape.update({
            strokeType: v,
          })
        })
        app.persist()
      }}
    />
  )
})

const ArrowModeAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<LineShape>('ArrowMode')

  const StrokeTypeOptions: ToggleGroupInputOption[] = [
    {
      value: 'start',
      icon: 'arrow-narrow-left',
    },
    {
      value: 'end',
      icon: 'arrow-narrow-right',
    },
  ]

  const startValue = shapes.every(s => s.props.decorations?.start === Decoration.Arrow)
  const endValue = shapes.every(s => s.props.decorations?.end === Decoration.Arrow)

  const value = [startValue ? 'start' : null, endValue ? 'end' : null].filter(isNonNullable)

  const valueToDecorations = (value: string[]) => {
    return {
      start: value.includes('start') ? Decoration.Arrow : null,
      end: value.includes('end') ? Decoration.Arrow : null,
    }
  }

  return (
    <ToggleGroupMultipleInput
      title={t('whiteboard/arrow-head')}
      options={StrokeTypeOptions}
      value={value}
      onValueChange={v => {
        shapes.forEach(shape => {
          shape.update({
            decorations: valueToDecorations(v),
          })
        })
        app.persist()
      }}
    />
  )
})

const TextStyleAction = observer(() => {
  const app = useApp<Shape>()
  const {
    handlers: { t },
  } = React.useContext(LogseqContext)
  const shapes = filterShapeByAction<TextShape>('TextStyle')

  const bold = shapes.every(s => s.props.fontWeight > 500)
  const italic = shapes.every(s => s.props.italic)

  return (
    <span className="flex gap-1">
      <ToggleInput
        tooltip={t('whiteboard/bold')}
        className="tl-button"
        pressed={bold}
        onPressedChange={v => {
          shapes.forEach(shape => {
            shape.update({
              fontWeight: v ? 700 : 400,
            })
            shape.onResetBounds()
          })
          app.persist()
        }}
      >
        <TablerIcon name="bold" />
      </ToggleInput>
      <ToggleInput
        tooltip={t('whiteboard/italic')}
        className="tl-button"
        pressed={italic}
        onPressedChange={v => {
          shapes.forEach(shape => {
            shape.update({
              italic: v,
            })
            shape.onResetBounds()
          })
          app.persist()
        }}
      >
        <TablerIcon name="italic" />
      </ToggleInput>
    </span>
  )
})

const LinksAction = observer(() => {
  const app = useApp<Shape>()
  const shape = app.selectedShapesArray[0]

  const handleChange = (refs: string[]) => {
    shape.update({ refs: refs })
    app.persist()
  }

  return (
    <ShapeLinksInput
      onRefsChange={handleChange}
      refs={shape.props.refs ?? []}
      shapeType={shape.props.type}
      side="right"
      pageId={shape.props.type === 'logseq-portal' ? shape.props.pageId : undefined}
      portalType={shape.props.type === 'logseq-portal' ? shape.props.blockType : undefined}
    />
  )
})

contextBarActionMapping.set('Geometry', GeometryAction)
contextBarActionMapping.set('AutoResizing', AutoResizingAction)
contextBarActionMapping.set('LogseqPortalViewMode', LogseqPortalViewModeAction)
contextBarActionMapping.set('ScaleLevel', ScaleLevelAction)
contextBarActionMapping.set('YoutubeLink', YoutubeLinkAction)
contextBarActionMapping.set('TwitterLink', TwitterLinkAction)
contextBarActionMapping.set('IFrameSource', IFrameSourceAction)
contextBarActionMapping.set('NoFill', NoFillAction)
contextBarActionMapping.set('Swatch', SwatchAction)
contextBarActionMapping.set('StrokeType', StrokeTypeAction)
contextBarActionMapping.set('ArrowMode', ArrowModeAction)
contextBarActionMapping.set('TextStyle', TextStyleAction)
contextBarActionMapping.set('Links', LinksAction)
contextBarActionMapping.set('EditPdf', EditPdfAction)
const getContextBarActionTypes = (type: ShapeType) => {
  return (shapeMapping[type] ?? []).filter(isNonNullable)
}

export const getContextBarActionsForShapes = (shapes: Shape[]) => {
  const types = shapes.map(s => s.props.type)
  const actionTypes = new Set(shapes.length > 0 ? getContextBarActionTypes(types[0]) : [])
  for (let i = 1; i < types.length && actionTypes.size > 0; i++) {
    const otherActionTypes = getContextBarActionTypes(types[i])
    actionTypes.forEach(action => {
      if (!otherActionTypes.includes(action)) {
        actionTypes.delete(action)
      }
    })
  }
  if (shapes.length > 1) {
    singleShapeActions.forEach(action => {
      if (actionTypes.has(action)) {
        actionTypes.delete(action)
      }
    })
  }

  return Array.from(actionTypes)
    .sort((a, b) => contextBarActionTypes.indexOf(a) - contextBarActionTypes.indexOf(b))
    .map(action => contextBarActionMapping.get(action)!)
}
