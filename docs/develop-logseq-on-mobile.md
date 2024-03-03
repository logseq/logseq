# iOS development

## Installation
- Install Xcode 13 from App Store.
- Install [CocoaPods](https://cocoapods.org/)
  ```shell
  sudo gem install cocoapods
  ```
  Note: use the following commands from *ios/App* directory to fix **ffi_c.bundle** related issue for M1 MacBook [^1].  
  (Working directory: `ios/App`)
  ```shell
  arch -x86_64 sudo gem install ffi
  arch -x86_64 pod install
  ```
 
## Set up development environment
### Build the development app
- comment in `server` section in **capacitor.config.ts**, and replace `process.env.LOGSEQ_APP_ASERVER_URL` with your `http://your-local-ip-address:3001` (run `ifconfig` to check).
    ```typescript
    server: {
        url: "process.env.LOGSEQ_APP_ASERVER_URL",
        cleartext: true
        } 
    ```
- Working directory: Logseq root directory
- Run `yarn && yarn app-watch` from the logseq project root directory in terminal.
- Run `npx cap sync ios` in another terminal to copy web assets from public to *ios/App/App/public*, and create *capacitor.config.json* in *ios/App/App*, and update iOS plugins.
- Connect your iOS device to MacBook.
- Run `npx cap open ios` to open Logseq project in Xcode, and build the app there.

or, you can run `bb dev:ios-app` to do those steps with one command if you are on MacOS. To download bb, see https://github.com/babashka/babashka#installation. Also, in order to use mobile bb tasks on macOS, `gsed` needs to be installed in your system (run `brew install gnu-sed` to install).

Note: if the dev build isn't reflecting the change of code, restart `yarn app-watch` and run `npx cap sync ios` again.

### Build the release app
- Comment out `server` section above in **capacitor.config.ts**.
- Connect your iOS device to MacBook.
- Run `yarn run-ios-release` to install the release app to your iOS device.

or, you can run `bb release:ios-app` to do those steps with one command.

[^1] https://github.com/CocoaPods/CocoaPods/issues/10220#issuecomment-730963835


# Android development  
## Installation
- Install Android studio [^1] and SDK (newer than 30) tools
  Note: for M1 MacBook users.
  - Download version **Mac with Apple Chip** 
  - unzip it and move **Android Studio.app** file to **Applications**, or you will get the following error later.
    ```
     [error] Unable to launch Android Studio. Is it installed?
        Attempted to open Android Studio at: /Applications/Android Studio.app
        You can configure this with the CAPACITOR_ANDROID_STUDIO_PATH environment variable.
     ```
- In Android Studio, open **Tools** -> **SDK Manager** to install other SDK tools [^2].
  > In the SDK Tools tab, make sure to install at least the following:
  >> - Android SDK Build-Tools
  >> - Android SDK Command-line Tools
  >> - Android Emulator
  >> - Android SDK Platform-Tools

## Set up development environment
### Build the development app
- comment in `server` section in **capacitor.config.ts**, and replace `process.env.LOGSEQ_APP_ASERVER_URL` with your `http://your-local-ip-address:3001` (run `ifconfig` to check).
    ```typescript
    server: {
        url: "process.env.LOGSEQ_APP_ASERVER_URL",
        cleartext: true
        } 
    ```
- Run `yarn && yarn app-watch` from the logseq project root directory in terminal.
- Run `npx cap sync android` in another terminal.
- Run `npx cap run android` to install app into your device.

or, you can run `bb dev:android-app` to do those steps with one command if you are on macOS.

Then,
- In Android Studio, open **Tools** -> **AVD Manager** to create Android Virtual Device (AVD), and launch it in the emulator.
- In Android Studio, open **Run** -> **Run** to run Logseq.
- After logseq startup in Android virtual device, repl should be able to connect
- For browser console print and devtool remote debug, open chrome, type url chrome://inspect/#devices, you should see your device there, click inspect


### Build a release and install it to your android device 
- Comment out `server` section above in **capacitor.config.ts**.
- Connect your device to PC.
- Run `yarn run-android-release`.

or, you can run `bb release:android-app` to do those steps with one command.

### Build an apk
- Comment out `server` section above in **capacitor.config.ts**.
- Run `yarn run-android-release`

or, you can run `bb release:android-app` to do those steps with one command.

Then,
- In Android Studio, open **Build** -> **Build Bundles / APKs** -> **Build APKs**.
- Get your apk in `android/app/build/apk/debug`.
