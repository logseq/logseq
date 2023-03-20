# Build Logseq Desktop on Windows

This is a guide on setting up a Logseq development environment on Windows.

## Pre-requisites

  * NVM, Node, and Yarn
  ```
  winget install --id CoreyButler.NVMforWindows
  nvm install 18
  nvm use 18
  npm install -g yarn
  ```
  * Java
  ```
  winget install --id Microsoft.OpenJDK.17
  ```
  * Visual Studio
  ```
  winget install --id Microsoft.VisualStudio.2022.Community
  ```
  * An installer for clojure is available from [casselc/clj-msi](https://github.com/casselc/clj-msi/releases/)

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
