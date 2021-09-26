import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.logseq.app',
  appName: 'Logseq',
  bundledWebRuntime: false,
  webDir: 'public',
  server: {
    url: process.env.LOGSEQ_APP_SERVER_URL,
    cleartext: true
  }
};

export = config;
