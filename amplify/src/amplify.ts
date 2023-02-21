import '@aws-amplify/ui-react/styles.css'
import { Amplify } from 'aws-amplify'
import { LSAuthenticator } from './LSAuthenticator'

function setupAuthConfigure (config) {
  Amplify.configure({ Auth: config })
}

//@ts-ignore
window.LSAmplify = {
  setupAuthConfigure,
  LSAuthenticator
}