/***
 * Author: Junyi Du <junyi@logseq.com>
 * References:
 * https://stackoverflow.com/questions/8892238/detect-keyboard-layout-with-javascript
 * ***/

import { Page } from '@playwright/test'

interface RecordedEvent {
  event_type: string;
  event: any; // KeyboardEvent is too heavy
  latency: number;
}

export let dispatch_kb_events = async function (page: Page, selector: string, keyboard_events: RecordedEvent[] ){
  for (let kbev of keyboard_events){
    let { event_type, event, latency } = kbev
    await page.waitForTimeout(latency)
    await page.dispatchEvent(selector, event_type, event)
  }
}

export let macos_pinyin_left_full_square_bracket: RecordedEvent[] = [
  {
    "event_type": "keydown",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 0
  },
  {
    "event_type": "keypress",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 1
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 17
  }
]

export let win10_pinyin_left_full_square_bracket: RecordedEvent[] = [
  {
    "event_type": "keydown",
    "event": {
      "key": "Process",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 0
  },
  {
    "event_type": "compositionstart",
    "event": {},
    "latency": 4
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 12
  },
  {
    "event_type": "compositionend",
    "event": {},
    "latency": 1
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "Process",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 61
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "[",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 1
  }
]

export let win10_legacy_pinyin_left_full_square_bracket: RecordedEvent[] = [
  {
    "event_type": "keydown",
    "event": {
      "key": "Process",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 0
  },
  {
    "event_type": "compositionstart",
    "event": {},
    "latency": 1
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "compositionend",
    "event": {},
    "latency": 1
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "Process",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 93
  }
]

export let macos_pinyin_selecting_candidate_double_left_square_bracket: RecordedEvent[] = [
  {
    "event_type": "keydown",
    "event": {
      "key": "b",
      "code": "KeyB",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 0
  },
  {
    "event_type": "compositionstart",
    "event": {},
    "latency": 1
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "b",
      "code": "KeyB",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 48
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "】",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 200
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "】",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 59
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "】",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 289
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "】",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 73
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 443
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 79
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 155
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "【",
      "code": "BracketLeft",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 44
  },
  {
    "event_type": "compositionend",
    "event": {},
    "latency": 200
  }
]

export let win10_RIME_selecting_candidate_double_left_square_bracket: RecordedEvent[] = [
  {
    "event_type": "keydown",
    "event": {
      "key": "Process",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false
    },
    "latency": 0
  },
  {
    "event_type": "compositionstart",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "compositionupdate",
    "event": {},
    "latency": 0
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "Process",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 79
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "]",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 3
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "Process",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 200
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "Process",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 96
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "]",
      "code": "BracketRight",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true
    },
    "latency": 3
  },
  {
    "event_type": "compositionend",
    "event": {},
    "latency": 200
  }
]
