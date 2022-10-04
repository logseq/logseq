import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.logseq.app',
  appName: 'Logseq',
  bundledWebRuntime: false,
  webDir: 'public',
  plugins: {
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
  ios: {
    scheme: 'Logseq'
  },
  cordova: {
    staticPlugins: [
      '@logseq/capacitor-file-sync', // AgeEncryption requires static link
    ]
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
