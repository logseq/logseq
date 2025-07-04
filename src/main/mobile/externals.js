import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'

function initGlobalListeners (opts = {}) {
  console.debug('[externals] init global listeners')

  const didShowHandle = (event) => {
    const docHeight = document.documentElement.clientHeight
    const { keyboardHeight } = event
    const { onKeyboardShow } = opts

    if (onKeyboardShow) onKeyboardShow(event)

    if (keyboardHeight !== 0) {
      document.body.style.height = (docHeight - keyboardHeight) + 'px'
    }

    // const alertWrapper = document.querySelector('.alert-wrapper')
    // if (alertWrapper) {
    //   setTimeout(() => {
    //     alertWrapper.style.setProperty('transform',
    //       `translateY(-${keyboardHeight / 3}px)`, 'important')
    //   }, 100)
    // }
  }

  const didHideHandle = () => {
    const { onKeyboardHide } = opts
    if (onKeyboardHide) onKeyboardHide()

    document.body.style.removeProperty('height')

    // const alertWrapper = document.querySelector('.alert-wrapper')
    // if (alertWrapper) {
    //   alertWrapper.style.transform = 'translateY(0)'
    // }
  }

  Keyboard.addListener('keyboardWillShow', didShowHandle)
  Keyboard.addListener('keyboardWillHide', didHideHandle)

  return () => {
    Keyboard.removeAllListeners()
  }
}

let initialSettled = false

const settleStatusBar = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await (new Promise((r) => setTimeout(r, initialSettled ? 300 : 500)))
      if (!initialSettled) { initialSettled = true }
      await StatusBar.setStyle({ style: Style.Light }) // 可选：设置状态栏样式
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
      await StatusBar.setOverlaysWebView({ overlay: true })
    } catch (e) {
      console.error('[initStatusBar]', e)
    }
  }
}

window.externalsjs = {
  Keyboard, Capacitor, StatusBar,
  initGlobalListeners,
  settleStatusBar,
}
