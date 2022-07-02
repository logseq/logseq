import React from 'react';
import { styled, keyframes } from '@stitches/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useApp } from '@tldraw/react';

const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const StyledContent = styled(DropdownMenuPrimitive.Content, {
  backgroundColor: 'white',
  borderRadius: 6,
  padding: 5,
  boxShadow:
    '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    animationFillMode: 'forwards',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideUpAndFade },
      '&[data-side="bottom"]': { animationName: slideDownAndFade },
    },
  },
});

const itemStyles = {
  minWidth: '220px',
  all: 'unset',
  fontSize: 13,
  lineHeight: 1,
  color: 'black',
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  height: 25,
  padding: '0 5px',
  position: 'relative',
  userSelect: 'none',

  '&:focus': {
    backgroundColor: "black",
    color: "white",
  },
};

const StyledItem = styled(DropdownMenuPrimitive.Item, { ...itemStyles });
const StyledArrow = styled(DropdownMenuPrimitive.Arrow, {
  fill: 'white',
});


// Exports
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = StyledContent;
export const DropdownMenuItem = StyledItem;
export const DropdownMenuArrow = StyledArrow;

// Your app...
const Box = styled('div', {});

const RightSlot = styled('div', {
  marginLeft: 'auto',
  paddingLeft: 20,
  color: "black",
  ':focus > &': { color: 'white' },
});

//Change location of the radix dropdown menu being rendered



export const ZoomMenu = () => {
  const app = useApp();
  const preventEvent = (e:Event) => {
    e.preventDefault()
    console.log("hi")
  }
  return (
    <Box>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button>{(app.viewport.camera.zoom * 100).toFixed(0) + "%"} </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={12} >
        <DropdownMenuArrow></DropdownMenuArrow>
          <DropdownMenuItem onSelect={preventEvent} onClick={app.api.zoomToFit}>
            Zoom to Fit <RightSlot></RightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={preventEvent} onClick={app.api.zoomToSelection}>
            Zoom to Selection <RightSlot>⌘+Minus</RightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={preventEvent} onClick={app.api.zoomIn}>
            Zoom In <RightSlot>⌘+Plus</RightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={preventEvent} onClick={app.api.zoomOut}>
            Zoom Out <RightSlot>⌘+Minus</RightSlot>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={preventEvent} onClick={app.api.resetZoom}>
            Reset Zoom <RightSlot>⇧+0</RightSlot>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Box>
  );
};





export default ZoomMenu;

