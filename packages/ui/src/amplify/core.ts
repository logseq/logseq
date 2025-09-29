import { Amplify } from 'aws-amplify'
import { createContext, useContext } from 'react'

// Amplify.configure({
//   Auth: {}
// })

export const AuthFormRootContext = createContext<any>(null)
export const useAuthFormState = () => {
  return useContext(AuthFormRootContext)
}