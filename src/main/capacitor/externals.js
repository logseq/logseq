import { Keyboard } from '@capacitor/keyboard'

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

window.externalsjs = {
  initGlobalListeners,
}
