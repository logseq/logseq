

// typing 【
export let press_with_events = async function (page, selector, { typedown, keyboard_events }){
    await page.type(selector, typedown)
    for (let idx in keyboard_events){
      let ev = keyboard_events[idx]
      await page.dispatchEvent(selector, ev["type"], ev)
      await page.waitForTimeout(100)
    }
}

export let macos_pinyin_left_full_bracket = {
    "typedown": "【",
    "keyboard_events": [{
        "altKey": false,
        "charCode": 0,
        "ctrlKey": false,
        "code": "BracketLeft",
        "composed": true,
        "detail": 0,
        "event_": {
            "code": "BracketLeft",
            "isComposing": false,
            "composed": true
        },
        "isComposing": false,
        "isTrusted": true,
        "key": "【",
        "keyCode": 219,
        "metaKey": false,
        "repeat": false,
        "returnValue": true,
        "shiftKey": false,
        "type": "keydown",
        "which": 219,
        "platformModifierKey": false
    }, {
        "altKey": false,
        "charCode": 0,
        "ctrlKey": false,
        "event_": {
            "code": "BracketLeft",
            "isComposing": false,
            "composed": true
        },
        "key": "【",
        "keyCode": 219,
        "metaKey": false,
        "repeat": false,
        "shiftKey": false,
        "type": "keyup",
        "platformModifierKey": false
    }
]}
