export type TranslateFn = (
  locale: string,
  key: string,
  ...args: any
) => void

let _locale: string = 'en'
let _translate: TranslateFn = (
  locale: string,
  key: string,
  ...args: any
) => {
  return args[0] || 'Missing translation '
}

export function setTranslate(t: TranslateFn) {
  _translate = t
}

export function setLocale(locale: string) {
  _locale = locale
}

export const translate = (
  key: string,
  ...args: any
) => {
  return _translate(_locale, key, ...args)
}