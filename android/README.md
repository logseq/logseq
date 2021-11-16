## Installation:
* Download Android studio [^1] and SDK (newer than 30) tools
   Note: for M1 MacBook users.
   - Download version **Mac with Apple Chip** 
   - unzip it and move **Android Studio.app** file to **Applications**, or you will get the following error later.
     ```
     [error] Unable to launch Android Studio. Is it installed?
        Attempted to open Android Studio at: /Applications/Android Studio.app
        You can configure this with the CAPACITOR_ANDROID_STUDIO_PATH environment variable.
     ```
* In Android Studio, open **Tools** -> **SDK Manager** to install some other SDK tools [^2].
  > In the SDK Tools tab, make sure to install at least the following:
  >> - Android SDK Build-Tools
  >> - Android SDK Command-line Tools
  >> - Android Emulator
  >> - Android SDK Platform-Tools
* Run `yarn && yarn app-watch` from the logseq project root directory in terminal.
* Run `npx cap open android` in another termimal.
  Notes: for the first time after a fresh clone.
  - Run `npx cap copy android` to copy web assets from public to *android/app/src/main/assets/public*, and create *android/app/src/main/assets/capacitor.config.json*.
  - Run `npx cap update android` to update Android plugins.
  - Add the following code to *android/app/src/assets/capacitor.config.json*, and replace `server url` with your local-ip-address:3001 (run ifconfig to check)
  ```json
  "server": {
		"url": "http://your-own-id-address:3001",
		"cleartext": true} 
  ```
* In Android Studio, open **Tools** -> **AVD Manager** to create Android Virtual Device (AVD), and lanuch it in the emulator.
* In Android Studio, open **Run** -> **Run** to run Logseq.
* After logseq startup in Android virtual device, repl should be able to connect
* For browser console print and devtool remote debug, open chrome, type url chrome://inspect/#devices, you should see your device there, click inspect

[^1] https://developer.android.com/studio/index.html

[^2] https://capacitorjs.com/docs/getting-started/environment-setup

## Develop without opening Android Studio
1. brew install gradle
2. make sure java version using 11
3. cd web/android && gradle wrapper
4. install android sdk 30
