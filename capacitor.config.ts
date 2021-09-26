import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Logseq',
  appName: 'capacitor-testapp',
  bundledWebRuntime: false,
  webDir: 'public',
  server: {
    url: process.env.LOGSEQ_APP_SERVER_URL,
    cleartext: true
  }
};

export = config;
