

// typing 【
export let dispatch_kb_events = async function (page, selector, keyboard_events ){
    for (let idx in keyboard_events){
      let { event_type, event } = keyboard_events[idx]
      await page.dispatchEvent(selector, event_type, event)
      await page.waitForTimeout(100)
    }
}

export let macos_pinyin_left_full_bracket = [
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
      "isComposing": false,
      "composed": true
    }
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
      "isComposing": false,
      "composed": true
    }
  }
]

export let win10_pinyin_left_full_bracket = [
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
      "isComposing": false,
      "composed": true
    }
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
      "isComposing": false,
      "composed": true
    }
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
      "isComposing": false,
      "composed": true
    }
  }
]

export let win10_legacy_pinyin_left_full_bracket = [
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
      "isComposing": false,
      "composed": true
    }
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
      "isComposing": false,
      "composed": true
    }
  }
]

export let win10_RIME_left_full_bracket = [
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
      "isComposing": false,
      "composed": true
    }
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
      "isComposing": true,
      "composed": true
    }
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
      "isComposing": true,
      "composed": true
    }
  },
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
      "isComposing": true,
      "composed": true
    }
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
      "isComposing": true,
      "composed": true
    }
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
      "isComposing": true,
      "composed": true
    }
  },
  {
    "event_type": "keydown",
    "event": {
      "key": "Process",
      "code": "Space",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": true,
      "composed": true
    }
  },
  {
    "event_type": "keyup",
    "event": {
      "key": "Process",
      "code": "Space",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false,
      "composed": true
    }
  },
  {
    "event_type": "keyup",
    "event": {
      "key": " ",
      "code": "Space",
      "location": 0,
      "ctrlKey": false,
      "shiftKey": false,
      "altKey": false,
      "metaKey": false,
      "repeat": false,
      "isComposing": false,
      "composed": true
    }
  }
]