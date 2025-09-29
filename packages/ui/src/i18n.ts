export type TranslateFn = (
  locale: string,
  key: string,
  ...args: any
) => string

let _locale: string = 'en'
let _translate: TranslateFn = (
  locale: string,
  key: string,
  ...args: any
) => {
  return args[0] || key
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