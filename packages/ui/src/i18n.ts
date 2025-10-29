export type TranslateFn = (
  locale: string,
  dicts: Record<string, any>,
  key: string,
  ...args: any
) => string

let _nsDicts = {}
let _locale: string = 'en'
let _translate: TranslateFn = (
  locale: string,
  dicts: Record<string, any>,
  key: string,
  ...args: any
) => {
  return dicts[locale]?.[key] || args[0] || key
}

export function setTranslate(t: TranslateFn) {
  _translate = t
}

export function setLocale(locale: string) {
  _locale = locale
}

export function setNSDicts(ns: string, dicts: Record<string, string>) {
  (_nsDicts as any)[ns] = dicts
}

export const translate = (
  ns: string,
  key: string,
  ...args: any
) => {
  const dicts = (_nsDicts as any)[ns] || {}
  return _translate(
    _nsDicts?.hasOwnProperty(_locale) ? _locale : 'en',
    dicts, key, ...args)
}