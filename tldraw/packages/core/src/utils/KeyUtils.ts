import Mousetrap from 'mousetrap'

type AvailableTags = 'INPUT' | 'TEXTAREA' | 'SELECT'

const tagFilter = ({ target }: KeyboardEvent, enableOnTags?: AvailableTags[]) => {
  const targetTagName = target && (target as HTMLElement).tagName
  return Boolean(
    targetTagName && enableOnTags && enableOnTags.includes(targetTagName as AvailableTags)
  )
}

export class KeyUtils {
  static registerShortcut(
    keys: string | string[],
    callback: (keyboardEvent: Mousetrap.ExtendedKeyboardEvent, combo: string) => void
  ) {
    const fn = (keyboardEvent: Mousetrap.ExtendedKeyboardEvent, combo: string): void => {
      keyboardEvent.preventDefault()
      if (
        tagFilter(keyboardEvent, ['INPUT', 'TEXTAREA', 'SELECT']) ||
        (keyboardEvent.target as HTMLElement)?.isContentEditable
      ) {
        return
      }
      callback(keyboardEvent, combo)
    }
    Mousetrap.bind(keys, fn, 'keydown')
    return () => {
      Mousetrap.unbind(keys, 'keydown')
    }
  }
}
