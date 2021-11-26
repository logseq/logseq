import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.logseq.app',
    appName: 'Logseq',
    bundledWebRuntime: false,
    webDir: 'public',
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: false,
            androidScaleType: "CENTER_CROP",
            splashImmersive: true,
            backgroundColor: "#002b36"
        },
    }
    // do not commit this into source control
    // source: https://capacitorjs.com/docs/guides/live-reload
    , server: {
       url: "http://192.168.0.104:3001" //process.env.LOGSEQ_APP_SERVER_URL,
       cleartext: true
    }
};

export = config;
