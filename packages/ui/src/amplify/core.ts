import { Amplify } from 'aws-amplify'
import { createContext, useContext } from 'react'
import { translate, setNSDicts, setLocale } from '../i18n'
import defaultLang from './lang'

export const AuthFormRootContext = createContext<any>(null)
export const useAuthFormState = () => {
  return useContext(AuthFormRootContext)
}

export function t(key: string, ...args: any) {
  return translate('amplify', key, ...args)
}

export function init({ lang, authCognito }: any) {
  // Load default language
  setNSDicts('amplify', defaultLang)
  if (lang) setLocale(lang)
  Amplify.configure({
    Auth: {
      Cognito: {
        ...authCognito,
        loginWith: { email: true }
      }
    }
  })
}
