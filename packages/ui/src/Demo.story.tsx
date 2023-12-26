import { Button } from '../@/components/ui/button'
import { Meta, StoryObj } from '@storybook/react'
import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'

export default {
  title: 'JS/Button',
  component: Button,
  args: {
    children: 'LS Button'
  }
} as Meta

type Checked = DropdownMenuCheckboxItemProps['checked']

export function DropdownMenuCheckboxes() {
  const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true)
  const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false)
  const [showPanel, setShowPanel] = React.useState<Checked>(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/*<Button variant="outline">Open</Button>*/}
        <button>open-x?</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
        >
          <b className={'text-red-500'}>
            Status Bar
          </b>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showActivityBar}
          onCheckedChange={setShowActivityBar}
          disabled
        >
          Activity Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showPanel}
          onCheckedChange={setShowPanel}
        >
          Panel
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Primary: StoryObj =
  {
    render: () => {
      const { toast } = useToast()

      return (
        <div className={'p-20'}>
          <DropdownMenuCheckboxes/>
          <Button onClick={() => {
            const p = toast({
              title: 'hello',
              description: <Button onClick={() => p.dismiss()}>hello</Button>
            })
          }}>toast</Button>
          <hr/>

          <Toaster/>
        </div>
      )
    }
  }