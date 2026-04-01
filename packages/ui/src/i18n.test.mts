import test from 'node:test'
import assert from 'node:assert/strict'

import { setLocale, setNSDicts, setTranslate, translate } from './i18n.ts'

test('translate uses the selected locale when the namespace dict contains it', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('locale', {
    en: { greeting: 'Hello' },
    'zh-cn': { greeting: '你好' }
  })
  setLocale('zh-cn')

  assert.equal(translate('locale', 'greeting'), '你好')
})

test('translate falls back to English when the current locale is unavailable', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('fallback', {
    en: { greeting: 'Hello' }
  })
  setLocale('zh-cn')

  assert.equal(translate('fallback', 'greeting'), 'Hello')
})

test('translate falls back to English when the current locale dict has no corresponding key', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('fallback', {
    en: { greeting: 'Hello' },
    'zh-cn': { farewell: '再见' }
  })
  setLocale('zh-cn')

  assert.equal(translate('fallback', 'greeting'), 'Hello')
})

