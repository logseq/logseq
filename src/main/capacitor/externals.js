import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'

function initGlobalListeners () {
  console.debug('[externals] init global listeners')

  const didShowHandle = (event) => {
    const { keyboardHeight } = event
    const alertWrapper = document.querySelector('.alert-wrapper')
    if (alertWrapper) {
      setTimeout(() => {
        alertWrapper.style.setProperty('transform',
          `translateY(-${keyboardHeight / 3}px)`, 'important')
      }, 100)
    }
  }

  const didHideHandle = () => {
    const alertWrapper = document.querySelector('.alert-wrapper')
    if (alertWrapper) {
      alertWrapper.style.transform = 'translateY(0)'
    }
  }

  Keyboard.addListener('keyboardWillShow', didShowHandle)
  Keyboard.addListener('keyboardWillHide', didHideHandle)

  return () => {
    Keyboard.removeAllListeners()
  }
}

const settleStatusBar = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await Capacitor.Plugins.App.getInfo() // 等待平台初始化??
      await (new Promise((r) => setTimeout(r, 500)))
      await StatusBar.setStyle({ style: Style.Light }) // 可选：设置状态栏样式
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
      await StatusBar.setOverlaysWebView({ overlay: true })
    } catch (e) {
      console.error('[initStatusBar]', e)
    }
  }
}

window.externalsjs = {
  initGlobalListeners,
  settleStatusBar,
}
