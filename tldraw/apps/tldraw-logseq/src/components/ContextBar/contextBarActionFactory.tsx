import { isNonNullable } from '@tldraw/core'
import { useApp } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import { TablerIcon } from '~components/icons'
import { SelectInput, SelectOption } from '~components/inputs/SelectInput'
import { ToggleGroupInput, ToggleGroupInputOption } from '~components/inputs/ToggleGroupInput'
import { LogseqPortalShape, Shape } from '~lib'

export const contextBarActionTypes = [
  'NoFill',
  'LogseqPortalViewMode',
  'ScaleLevel',
  'ColorAccent',
  'StrokeColor',
  'NoStroke',
  'OpenPage',
  'OpenInRightSidebar',
] as const

type ContextBarActionType = typeof contextBarActionTypes[number]

const contextBarActionMapping = new Map<ContextBarActionType, React.FC>()

const LogseqPortalViewModeAction = observer(() => {
  const app = useApp<Shape>()
  const shapes = app.selectedShapesArray.filter(
    s => s.props.type === LogseqPortalShape.defaultProps.type
  ) as LogseqPortalShape[]

  const collapsed = shapes.every(s => s.collapsed)
  const ViewModeOptions: ToggleGroupInputOption[] = [
    {
      value: '0',
      icon: 'layout-navbar-expand',
    },
    {
      value: '1',
      icon: 'layout-navbar-collapse',
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

contextBarActionMapping.set('LogseqPortalViewMode', LogseqPortalViewModeAction)
contextBarActionMapping.set('ScaleLevel', ScaleLevelAction)

type ShapeType = Shape['props']['type']

const shapeMapping: Partial<Record<ShapeType, ContextBarActionType[]>> = {
  'logseq-portal': ['LogseqPortalViewMode', 'ScaleLevel'],
}

export const getContextBarActionsForType = (type: ShapeType) => {
  return (shapeMapping[type] ?? [])
    .map(actionType => contextBarActionMapping.get(actionType))
    .filter(isNonNullable)
}

export const getContextBarActionsForTypes = (types: ShapeType[]) => {
  const actions = new Set(types.length > 0 ? getContextBarActionsForType(types[0]) : [])
  for (let i = 1; i < types.length && actions.size > 0; i++) {
    const actionsForType = getContextBarActionsForType(types[i])
    actions.forEach(action => {
      if (!actionsForType.includes(action)) {
        actions.delete(action)
      }
    })
  }
  return Array.from(actions)
}
