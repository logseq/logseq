## install list:
* Android studio
* SDK 30
* other sdk tools in Android studio preference setting https://capacitorjs.com/docs/getting-started/environment-setup
* change the server url in `capacitor.config.ts` with your local ip:3001 (run ifconfig to check)
* run `yarn && yarn app-watch`
* in another console, run `npx cap open android`
* create Android virtual device in Android studio
* click the run button in Android stutio to run the project
* after logseq startup in Android virtual device, repl should be able to connect
* for browser console print and devtool remote debug, open chrome, type url chrome://inspect/#devices, you should see your device there, click inspect


## Develop without opening Android Studio
1. brew install gradle
2. make sure java version using 11
3. cd web/android && gradle wrapper
4. install android sdk 30
