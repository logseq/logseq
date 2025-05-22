import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'

function initGlobalListeners () {
  console.debug('[externals] init global listeners')

  const didShowHandle = (event) => {
    const docHeight = document.documentElement.clientHeight
    const { keyboardHeight } = event
    if (keyboardHeight === 0) return
    document.body.style.height = (docHeight - keyboardHeight) + 'px'

    // const alertWrapper = document.querySelector('.alert-wrapper')
    // if (alertWrapper) {
    //   setTimeout(() => {
    //     alertWrapper.style.setProperty('transform',
    //       `translateY(-${keyboardHeight / 3}px)`, 'important')
    //   }, 100)
    // }
  }

  const didHideHandle = () => {
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
      await Capacitor.Plugins.App.getInfo() // 等待平台初始化??
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

function checkCursorLine (textarea) {
  const { value, selectionStart } = textarea

  const lines = value.split('\n')
  const totalLines = lines.length

  const textBeforeCursor = value.substring(0, selectionStart)
  const currentLine = textBeforeCursor.split('\n').length

  const isFirstLine = currentLine === 1
  const isLastLine = currentLine === totalLines

  return { isFirstLine, isLastLine, currentLine, totalLines }
}

window.externalsjs = {
  initGlobalListeners,
  settleStatusBar,
  checkCursorLine,
}
