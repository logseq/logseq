# Build Logseq Desktop on Windows

## Intro
This is a guide on creating Logseq development environment on Windows with `PowerShell`. Non-platform specific instructions like [Develop Logseq](develop-logseq.md) **should also be referenced**.

## Pre-requisites
* Ensure `Set-ExecutionPolicy Unrestricted` (or other equivalent)
* Good network connection. Here's [An example of setting up proxy in PowerShell](#an-example-of-setting-up-proxy-in-powershell)
* Node.js 16.x
* Clojure (follow this [Guidance](https://clojure.org/guides/getting_started#_installation_on_windows))
* JRE 8 (required for Clojure)

(updated 20220218. May confirm via JAVA_VERSION and NODE_VERSION in [THIS FILE](https://github.com/logseq/logseq/blob/master/.github/workflows/build.yml))

### An example of installing pre-requisites on Windows
* Install [Chocolatey](https://chocolatey.org/)
* Install JRE
* Install NVM for Windows, Node.js, and Yarn
  ```
  choco install nvm
  nvm install 16.13.0 (or whatever version)
  nvm use 16.13.0
  npm install -g yarn
  nvm use 16.13.0
  ```
* Install [clj-on-windows](https://github.com/clojure/tools.deps.alpha/wiki/clj-on-Windows)

Congrats! The pre-requisites are ready.

## Set-up development environment (web app)
The basic idea is replacing the `clojure` commands in [package.json](https://github.com/logseq/logseq/blob/master/package.json) to `clj`.  
Go to your cloned Logseq repo. Then install dependencies, execute the `clj` equivalent of `yarn watch` via doing the `gulp`'s job manually (as it's not available on Windows). Refer [THIS](#an-example-of-setting-up-proxy-in-powershell) if you want to setup proxy in `PowerShell`.
* copy files in `resources` to `static`
* ```
  yarn
  clj -M:cljs watch app electron
  ```
* ```
  yarn css:watch
  ```

Now you can access the app via `http://localhost:3001` and all changes to the code will be watched.

## Set-up development environment (desktop)
To run the desktop app in development mode, after setting up web app development environment, run following commands which are equivalent to `yarn dev-electron-app`:
* ```
  cd static
  yarn
  yarn electron:dev
  ```
The desktop app should pop-up on your screen.

## An example of setting up proxy in PowerShell
```
$env:GLOBAL_AGENT_HTTPS_PROXY='http://<proxy-host>:<proxy-port>'
$env:ELECTRON_GET_USE_PROXY='true'
$env:HTTPS_PROXY='http://<proxy-host>:<proxy-port>'
$env:HTTP_PROXY='http://<proxy-host>:<proxy-port>'
```
