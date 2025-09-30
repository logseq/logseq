import { Amplify } from 'aws-amplify'
import { createContext, useContext } from 'react'
import { translate, setNSDicts, setLocale } from '../i18n'

// Amplify.configure({
//   Auth: {}
// })

export const AuthFormRootContext = createContext<any>(null)
export const useAuthFormState = () => {
  return useContext(AuthFormRootContext)
}

export function t(key: string, ...args: any) {
  return translate('amplify', key, ...args)
}

export function init() {
  // Load default language
  setNSDicts('amplify', require('./lang').default)
}