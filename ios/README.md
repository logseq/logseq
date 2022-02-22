Installation:

* Install Xcode 13 from App Store.
* Install [CocoaPods](https://cocoapods.org/)
  ```shell
  sudo gem install cocoapods
  ```
  Note: use the following commands from *ios/App* directory to fix **ffi_c.bundle** related issue for M1 MacBook [^1].
  ```shell
  sudo arch -x86_64 gem install ffi
  arch -x86_64 pod install
  ```
* Run `yarn && yarn app-watch` from the logseq project root directory in terminal.
* Open Logseq project in Xcode by running the following command in termimal.
  ```shell
  npx cap open ios
  ```
  Note: for the first time after a fresh clone.
  - Run `npx cap copy ios` to copy web assets from public to *ios/App/App/public*, and create *capacitor.config.json* in *ios/App/App*.
  - Run `npx cap update ios` to update iOS plugins.
  - Add the following code to *ios/App/App/capacitor.config.json*, and replace `server url` with your local-ip-address:3001 (run ifconfig to check)
    ```json
    "server": {
        "url": "http://your-own-id-address:3001",
        "cleartext": true} 
    ```
* Run logseq 
  ```shell
  npx cap run ios
  ```
  
[^1] https://github.com/CocoaPods/CocoaPods/issues/10220#issuecomment-730963835
  
