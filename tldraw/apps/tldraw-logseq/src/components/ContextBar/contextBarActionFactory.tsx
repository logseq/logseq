import { Decoration, isNonNullable, validUUID } from '@tldraw/core'
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
} from '../../lib'
import { LogseqContext } from '../../lib/logseq-context'
import { Button } from '../Button'
import { TablerIcon } from '../icons'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput, type SelectOption } from '../inputs/SelectInput'
import { ShapeLinksInput } from '../inputs/ShapeLinksInput'
import { TextInput } from '../inputs/TextInput'
import {
  ToggleGroupInput,
  ToggleGroupMultipleInput,
  type ToggleGroupInputOption,
} from '../inputs/ToggleGroupInput'
import { ToggleInput } from '../inputs/ToggleInput'

export const contextBarActionTypes = [
  // Order matters
  'Edit',
  'AutoResizing',
  'Swatch',
  'NoFill',
  'StrokeType',
  'ScaleLevel',
  'TextStyle',
  'YoutubeLink',
  'IFrameSource',
  'LogseqPortalViewMode',
  'ArrowMode',
  'Links',
] as const

type ContextBarActionType = typeof contextBarActionTypes[number]
const singleShapeActions: ContextBarActionType[] = ['Edit', 'YoutubeLink', 'IFrameSource', 'Links']

const contextBarActionMapping = new Map<ContextBarActionType, React.FC>()

type ShapeType = Shape['props']['type']

export const shapeMapping: Record<ShapeType, ContextBarActionType[]> = {
  'logseq-portal': [
    'Swatch',
    'Edit',
    'LogseqPortalViewMode',
    'ScaleLevel',
    'AutoResizing',
    'Links',
  ],
  youtube: ['YoutubeLink', 'Links'],
  iframe: ['IFrameSource', 'Links'],
  box: ['Edit', 'TextStyle', 'Swatch', 'NoFill', 'StrokeType', 'Links'],
  ellipse: ['Edit', 'TextStyle', 'Swatch', 'NoFill', 'StrokeType', 'Links'],
  polygon: ['Edit', 'TextStyle', 'Swatch', 'NoFill', 'StrokeType', 'Links'],
  line: ['Edit', 'TextStyle', 'Swatch', 'ArrowMode', 'Links'],
  pencil: ['Swatch', 'Links'],
  highlighter: ['Swatch', 'Links'],
  text: ['Edit', 'TextStyle', 'Swatch', 'ScaleLevel', 'AutoResizing', 'Links'],
  html: ['ScaleLevel', 'AutoResizing', 'Links'],
  image: ['Links'],
  video: ['Links'],
}

export const withFillShapes = Object.entries(shapeMapping)
  .filter(([key, types]) => {
    return types.includes('NoFill') && types.includes('Swatch')
  })
  .map(([key]) => key) as ShapeType[]

function filterShapeByAction<S extends Shape>(shapes: Shape[], type: ContextBarActionType): S[] {
  return shapes.filter(shape => shapeMapping[shape.props.type]?.includes(type)) as S[]
}

const EditAction = observer(() => {
  const app = useApp<Shape>()
  const shape = filterShapeByAction(app.selectedShapesArray, 'Edit')[0]
  const iconName =
    ('label' in shape.props && shape.props.label) || ('text' in shape.props && shape.props.text)
      ? 'forms'
      : 'text'

  return (
    <Button
      type="button"
      tooltip="Edit"
      onClick={() => {
        app.api.editShape(shape)
        if (shape.props.type === 'logseq-portal') {
          let uuid = shape.props.pageId
          if (shape.props.blockType === 'P') {
            const firstNonePropertyBlock = window.logseq?.api
              ?.get_page_blocks_tree?.(shape.props.pageId)
              .find(b => !('propertiesOrder' in b))
            uuid = firstNonePropertyBlock.uuid
          }
          window.logseq?.api?.edit_block?.(uuid)
        }
      }}
    >
      <TablerIcon name={iconName} />
    </Button>
  )
})

const AutoResizingAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = filterShapeByAction<LogseqPortalShape | TextShape | HTMLShape>(
    app.selectedShapesArray,
    'AutoResizing'
  )

  const pressed = shapes.every(s => s.props.isAutoResizing)

  return (
    <ToggleInput
      title="Auto Resize"
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
  const shapes = filterShapeByAction<LogseqPortalShape>(
    app.selectedShapesArray,
    'LogseqPortalViewMode'
  )

  const collapsed = shapes.every(s => s.collapsed)
  const ViewModeOptions: ToggleGroupInputOption[] = [
    {
      value: '1',
      icon: 'object-compact',
    },
    {
      value: '0',
      icon: 'object-expanded',
    },
  ]
  return (
    <ToggleGroupInput
      title="View Mode"
      options={ViewModeOptions}
      value={collapsed ? '1' : '0'}
      onValueChange={v => {
        shapes.forEach(shape => {
          shape.setCollapsed(v === '1' ? true : false)
        })
        app.persist()
      }}
    />
  )
})

const ScaleLevelAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = filterShapeByAction<LogseqPortalShape>(app.selectedShapesArray, 'ScaleLevel')
  const scaleLevel = new Set(shapes.map(s => s.scaleLevel)).size > 1 ? '' : shapes[0].scaleLevel
  const sizeOptions: SelectOption[] = [
    {
      label: 'Extra Small',
      value: 'xs',
    },
    {
      label: 'Small',
      value: 'sm',
    },
    {
      label: 'Medium',
      value: 'md',
    },
    {
      label: 'Large',
      value: 'lg',
    },
    {
      label: 'Extra Large',
      value: 'xl',
    },
    {
      label: 'Huge',
      value: 'xxl',
    },
  ]
  return (
    <SelectInput
      tooltip="Scale Level"
      options={sizeOptions}
      value={scaleLevel}
      onValueChange={v => {
        shapes.forEach(shape => {
          shape.setScaleLevel(v as LogseqPortalShape['props']['scaleLevel'])
        })
        app.persist()
      }}
    />
  )
})

const IFrameSourceAction = observer(() => {
  const app = useApp<Shape>()
  const shape = filterShapeByAction<IFrameShape>(app.selectedShapesArray, 'IFrameSource')[0]

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shape.onIFrameSourceChange(e.target.value.trim().toLowerCase())
    app.persist()
  }, [])

  const handleReload = React.useCallback(() => {
    shape.reload()
  }, [])

  return (
    <span className="flex gap-3">
      <Button tooltip="Reload" type="button" onClick={handleReload}>
        <TablerIcon name="refresh" />
      </Button>
      <TextInput
        title="Website Url"
        className="tl-iframe-src"
        value={`${shape.props.url}`}
        onChange={handleChange}
      />
      <Button tooltip="Open website url" type="button" onClick={() => window.open(shape.props.url)}>
        <TablerIcon name="external-link" />
      </Button>
    </span>
  )
})

const YoutubeLinkAction = observer(() => {
  const app = useApp<Shape>()
  const shape = filterShapeByAction<YouTubeShape>(app.selectedShapesArray, 'YoutubeLink')[0]
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shape.onYoutubeLinkChange(e.target.value)
    app.persist()
  }, [])

  return (
    <span className="flex gap-3">
      <TextInput
        title="YouTube Link"
        className="tl-youtube-link"
        value={`${shape.props.url}`}
        onChange={handleChange}
      />
      <Button
        tooltip="Open YouTube Link"
        type="button"
        onClick={() => window.logseq?.api?.open_external_link?.(shape.props.url)}
      >
        <TablerIcon name="external-link" />
      </Button>
    </span>
  )
})

const NoFillAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = filterShapeByAction<BoxShape | PolygonShape | EllipseShape>(
    app.selectedShapesArray,
    'NoFill'
  )
  const handleChange = React.useCallback((v: boolean) => {
    shapes.forEach(s => s.update({ noFill: v }))
    app.persist()
  }, [])

  const noFill = shapes.every(s => s.props.noFill)

  return (
    <ToggleInput
      title="Fill"
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
  >(app.selectedShapesArray, 'Swatch')

  const handleSetColor = React.useCallback((color: string) => {
    shapes.forEach(s => {
      s.update({ fill: color, stroke: color })
    })
    app.persist()
  }, [])

  const handleSetOpacity = React.useCallback((opacity: number) => {
    shapes.forEach(s => {
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

const StrokeTypeAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = filterShapeByAction<
    BoxShape | PolygonShape | EllipseShape | LineShape | PencilShape
  >(app.selectedShapesArray, 'StrokeType')

  const StrokeTypeOptions: ToggleGroupInputOption[] = [
    {
      value: 'line',
      icon: 'circle',
    },
    {
      value: 'dashed',
      icon: 'circle-dashed',
    },
  ]

  const value = shapes.every(s => s.props.strokeType === 'dashed')
    ? 'dashed'
    : shapes.every(s => s.props.strokeType === 'line')
    ? 'line'
    : 'mixed'

  return (
    <ToggleGroupInput
      title="Stroke Type"
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
  const shapes = filterShapeByAction<LineShape>(app.selectedShapesArray, 'ArrowMode')

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
      title="Arrow Head"
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
  const shapes = filterShapeByAction<TextShape>(app.selectedShapesArray, 'TextStyle')

  const bold = shapes.every(s => s.props.fontWeight > 500)
  const italic = shapes.every(s => s.props.italic)

  return (
    <span className="flex gap-1">
      <ToggleInput
        title="Bold"
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
        title="Italic"
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

contextBarActionMapping.set('Edit', EditAction)
contextBarActionMapping.set('AutoResizing', AutoResizingAction)
contextBarActionMapping.set('LogseqPortalViewMode', LogseqPortalViewModeAction)
contextBarActionMapping.set('ScaleLevel', ScaleLevelAction)
contextBarActionMapping.set('YoutubeLink', YoutubeLinkAction)
contextBarActionMapping.set('IFrameSource', IFrameSourceAction)
contextBarActionMapping.set('NoFill', NoFillAction)
contextBarActionMapping.set('Swatch', SwatchAction)
contextBarActionMapping.set('StrokeType', StrokeTypeAction)
contextBarActionMapping.set('ArrowMode', ArrowModeAction)
contextBarActionMapping.set('TextStyle', TextStyleAction)
contextBarActionMapping.set('Links', LinksAction)

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
