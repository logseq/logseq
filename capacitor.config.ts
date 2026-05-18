import { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'
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
    App: {
      // Logseq routes back presses through MainActivity -> JS (window.LogseqNative.onNativePop).
      // Disable @capacitor/app's built-in OnBackPressedCallback so it doesn't intercept the
      // first edge-back gesture by calling webView.goBack() (which causes a flash and swallows
      // the event before our handler runs). See android/app/.../MainActivity.java.
      disableBackButtonHandler: true,
    },

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
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
    },

    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#000000',
      statusBarContent: 'light',
      navigationBarColor: '#000000',
      navigationBarContent: 'light',
      offset: 0
    }
  },
  android: {
    appendUserAgent: `Logseq/${version} (Android)`,
  },
  ios: {
    scheme: 'Logseq',
    appendUserAgent: `Logseq/${version} (iOS)`,
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
