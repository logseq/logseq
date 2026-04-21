import test from 'node:test'
import assert from 'node:assert/strict'

import { setLocale, setNSDicts, setTranslate, translate } from './i18n'
import { getAuthErrorMessageKey } from './amplify/errors'

test('translate uses the selected locale when the namespace dict contains it', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('locale', {
    en: { greeting: 'Hello' },
    'zh-CN': { greeting: '你好' }
  })
  setLocale('zh-CN')

  assert.equal(translate('locale', 'greeting'), '你好')
})

test('translate falls back to English when the current locale is unavailable', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('fallback', {
    en: { greeting: 'Hello' }
  })
  setLocale('zh-CN')

  assert.equal(translate('fallback', 'greeting'), 'Hello')
})

test('translate falls back to English when the current locale dict has no corresponding key', () => {
  setTranslate((locale, dicts, key, ...args) => dicts[locale]?.[key] ?? args[0] ?? key)
  setNSDicts('fallback', {
    en: { greeting: 'Hello' },
    'zh-CN': { farewell: '再见' }
  })
  setLocale('zh-CN')

  assert.equal(translate('fallback', 'greeting'), 'Hello')
})

test('getAuthErrorMessageKey maps common Cognito errors to localized keys', () => {
  assert.equal(getAuthErrorMessageKey({ name: 'NotAuthorizedException' }), 'AUTH_ERROR_INVALID_CREDENTIALS')
  assert.equal(getAuthErrorMessageKey({ name: 'CodeMismatchException' }), 'AUTH_ERROR_CODE_MISMATCH')
  assert.equal(getAuthErrorMessageKey({ name: 'InvalidPasswordException' }), 'PW_POLICY_TIP')
})

test('getAuthErrorMessageKey falls back to a generic localized key for unknown errors', () => {
  assert.equal(getAuthErrorMessageKey({ name: 'SomethingUnexpected' }), 'AUTH_ERROR_GENERIC')
  assert.equal(getAuthErrorMessageKey(new Error('plain error')), 'AUTH_ERROR_GENERIC')
})
