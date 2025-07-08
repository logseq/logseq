import { CapacitorConfig } from '@capacitor/cli'
import * as fs from 'fs'

const version = fs.readFileSync('static/package.json', 'utf8').match(/"version": "(.*?)"/)?.at(1) ?? '0.0.0'

const config: CapacitorConfig = {
  appId: 'com.logseq.app',
  appName: 'Logseq',
  webDir: 'static/mobile',
  loggingBehavior: 'debug',
  server: {
      androidScheme: 'http',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'Light',
      backgroundColor: '#ffffffff',
    },

    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: false,
      backgroundColor: '#002b36'
    },

    Keyboard: {
      resize: 'none'
    }
  },
  android: {
    appendUserAgent: `Logseq/${version} (Android)`
  },
  ios: {
    scheme: 'Logseq',
    appendUserAgent: `Logseq/${version} (iOS)`
  }
}

if (process.env.LOGSEQ_APP_SERVER_URL) {
  Object.assign(config, {
    server: {
      url: process.env.LOGSEQ_APP_SERVER_URL,
      cleartext: true
    }
  })
}

export = config;
