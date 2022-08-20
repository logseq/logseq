import { isNonNullable } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { TablerIcon } from '~components/icons'
import { SelectInput, SelectOption } from '~components/inputs/SelectInput'
import { ToggleGroupInput, ToggleGroupInputOption } from '~components/inputs/ToggleGroupInput'
import { LogseqPortalShape, Shape } from '~lib'
import { LogseqContext } from '~lib/logseq-context'

export const contextBarActionTypes = [
  // Order matters
  'NoFill',
  'ColorAccent',
  'StrokeColor',
  'NoStroke',
  'ScaleLevel',
  'LogseqPortalViewMode',
  'OpenPage',
] as const

type ContextBarActionType = typeof contextBarActionTypes[number]
const singleShapeActions: ContextBarActionType[] = ['OpenPage']

const contextBarActionMapping = new Map<ContextBarActionType, React.FC>()

const LogseqPortalViewModeAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = app.selectedShapesArray.filter(
    s => s.props.type === LogseqPortalShape.defaultProps.type
  ) as LogseqPortalShape[]

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
      options={ViewModeOptions}
      value={collapsed ? '1' : '0'}
      onValueChange={v => {
        shapes.forEach(shape => {
          shape.setCollapsed(v === '1' ? true : false)
        })
      }}
    />
  )
})

const ScaleLevelAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = app.selectedShapesArray.filter(
    s => s.props.type === LogseqPortalShape.defaultProps.type
  ) as LogseqPortalShape[]

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
      label: '2 Extra Large',
      value: 'xxl',
    },
  ]
  return (
    <SelectInput
      options={sizeOptions}
      value={scaleLevel}
      onValueChange={v => {
        if (v) {
          shapes.forEach(shape => {
            shape.setScaleLevel(v as LogseqPortalShape['props']['scaleLevel'])
          })
        }
      }}
    />
  )
})

const OpenPageAction = observer(() => {
  const { handlers } = React.useContext(LogseqContext)
  const app = useApp<Shape>()
  const shapes = app.selectedShapesArray.filter(
    s => s.props.type === LogseqPortalShape.defaultProps.type
  ) as LogseqPortalShape[]
  const shape = shapes[0]
  const { pageId, blockType } = shape.props

  return (
    <span className="flex gap-1">
      <button
        className="tl-contextbar-button"
        type="button"
        onClick={() => handlers?.sidebarAddBlock(pageId, blockType === 'B' ? 'block' : 'page')}
      >
        <TablerIcon name="layout-sidebar-right" />
      </button>
      <button
        className="tl-contextbar-button"
        type="button"
        onClick={() => handlers?.redirectToPage(pageId)}
      >
        <TablerIcon name="external-link" />
      </button>
    </span>
  )
})

contextBarActionMapping.set('LogseqPortalViewMode', LogseqPortalViewModeAction)
contextBarActionMapping.set('ScaleLevel', ScaleLevelAction)
contextBarActionMapping.set('OpenPage', OpenPageAction)

type ShapeType = Shape['props']['type']

const shapeMapping: Partial<Record<ShapeType, ContextBarActionType[]>> = {
  'logseq-portal': ['LogseqPortalViewMode', 'ScaleLevel', 'OpenPage'],
}

const getContextBarActionTypes = (type: ShapeType) => {
  return (shapeMapping[type] ?? []).filter(isNonNullable)
}

export const getContextBarActionsForTypes = (shapes: Shape[]) => {
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
