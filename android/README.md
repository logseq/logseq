## Set up development environment 
* Install Android studio [^1] and SDK (newer than 30) tools
   Note: for M1 MacBook users.
   - Download version **Mac with Apple Chip** 
   - unzip it and move **Android Studio.app** file to **Applications**, or you will get the following error later.
     ```
     [error] Unable to launch Android Studio. Is it installed?
        Attempted to open Android Studio at: /Applications/Android Studio.app
        You can configure this with the CAPACITOR_ANDROID_STUDIO_PATH environment variable.
     ```
* In Android Studio, open **Tools** -> **SDK Manager** to install other SDK tools [^2].
  > In the SDK Tools tab, make sure to install at least the following:
  >> - Android SDK Build-Tools
  >> - Android SDK Command-line Tools
  >> - Android Emulator
  >> - Android SDK Platform-Tools

## Build the development app in Android emulator
* Replace `server url` with your local-ip-address:3001 (run ifconfig to check) in *capacitor.config.ts*.
* Run `yarn && yarn app-watch` from the logseq project root directory in terminal.
* Run `npx cap sync android` in another termimal (all-in-one cmd).
* In Android Studio, open **Tools** -> **AVD Manager** to create Android Virtual Device (AVD), and lanuch it in the emulator.
* In Android Studio, open **Run** -> **Run** to run Logseq.
* After logseq startup in Android virtual device, repl should be able to connect
* For browser console print and devtool remote debug, open chrome, type url chrome://inspect/#devices, you should see your device there, click inspect

## Build a release and install it to your android device 
* Comment in `server url` in *capacitor.config.ts*.
* Connect your device to PC.
* Run `yarn clean && yarn release-app && rm -rf ./public/static && rm -rf ./static/js/*.map && mv static ./public && npx cap sync android && npx cap run android`

## Build a apk
* Comment out `server url` in *capacitor.config.ts*.
* Run `yarn clean && yarn release-app && rm -rf ./public/static && rm -rf ./static/js/*.map && mv static ./public && npx cap sync android`.
* In Android Studio, open **Build** -> **Build Bundles / APKs** -> **Build APKs**.
* Get your apk in `android/app/build/apk/debug`.

[^1] https://developer.android.com/studio/index.html

[^2] https://capacitorjs.com/docs/getting-started/environment-setup

## Develop without opening Android Studio
1. brew install gradle
2. make sure java version using 11
3. cd web/android && gradle wrapper
4. install android sdk 30
