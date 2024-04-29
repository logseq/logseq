# Setup Logseq development dependencies on Windows

This is a guide on setting up Logseq development dependencies on Windows.  Once these dependencies are installed, you can follow the  [develop-logseq](develop-logseq.md) docs for build instructions.

## [scoop](https://scoop.sh/)

Scoop provides a `clojure.exe` shim which works in Command Prompt and Powershell windows.

```
scoop bucket add scoop-clojure https://github.com/littleli/scoop-clojure
scoop bucket add extras
scoop bucket add java
scoop install java/openjdk clj-deps babashka leiningen nodejs-lts
```

## Winget

Winget is a package manager installed by default on windows.

  ```
  winget install --id CoreyButler.NVMforWindows
  nvm install 18
  nvm use 18
  npm install -g yarn
  winget install --id Microsoft.OpenJDK.17
  winget install --id Microsoft.VisualStudio.2022.Community
  ```

An installer for clojure is available from [casselc/clj-msi](https://github.com/casselc/clj-msi/releases/)

## [chocolatey](https://chocolatey.org/)

Chocolatey installs Clojure as a PowerShell module and alias, and does not provide `clojure` for `cmd.exe`.

[@andelf has written a wrapper utility](https://github.com/andelf/clojure-cli) which you can install with `cargo install --git https://github.com/andelf/clojure-cli.git` instead.

```
choco install nvm
nvm install 18
nvm use 18
npm install -g yarn
choco install visualstudio2022community
choco install javaruntime
choco install clojure
```

## Troubleshooting

### Configuring a proxy for internet access

```
$env:GLOBAL_AGENT_HTTPS_PROXY='http://<proxy-host>:<proxy-port>'
$env:ELECTRON_GET_USE_PROXY='true'
$env:HTTPS_PROXY='http://<proxy-host>:<proxy-port>'
$env:HTTP_PROXY='http://<proxy-host>:<proxy-port>'
```

### node-gyp cannot find visual studio

During the build process `node-gyp` may complain that it cannot find Visual Studio. Try building the app in Developer Powershell for VS(shipped with Visual Studio). If this does not work for you, [This issue](https://github.com/nodejs/node-gyp/issues/2203) may be helpful.


### Set up Clojure CLI repository mirror

add the following pair to `deps.edn`:

```
:mvn/repos {
  "central" {:url "https://maven.aliyun.com/repository/public"}
  "clojars" {:url "https://mirrors.tuna.tsinghua.edu.cn/clojars"}
}
```

The mirrors above are friendly to Chinese developers(with bad network), developers with self-hosted repositories can use their own services.
