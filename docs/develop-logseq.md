# Develop Logseq
## Requirements

- [Node.js](https://nodejs.org/en/download/) (See [build.yml](https://github.com/logseq/logseq/blob/master/.github/workflows/build.yml) for allowed version)  & [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Java & Clojure](https://clojure.org/guides/getting_started). (If you run into `Execution error (FileNotFoundException) at java.io.FileInputStream/open0 (FileInputStream.java:-2). -M:cljs (No such file or directory)`, it means you have a wrong Clojure version installed. Please uninstall it and follow the instructions linked.)

## Clone project

This is a required step before doing any development or production builds.

```bash
git clone https://github.com/logseq/logseq
cd logseq
```

## Browser development

### Development

```bash
yarn
yarn watch
```

Then open the browser <http://localhost:3001>.

### Production

```bash
yarn release
```

## Desktop app development

### Development

1. Install npm packages for building the desktop app

``` bash
yarn install
```
2. Compile to JavaScript and open the dev app

```bash
yarn watch
# Wait until watch reports `Build Completed.` for `:electron` and `:app`.
# Then, run the following command in a different shell.
# If you have opened desktop logseq, you should close it. Otherwise, this command will fail.
yarn dev-electron-app
```

Alternatively, run `bb dev:electron-start` to do this step with one command. To
download bb, see https://github.com/babashka/babashka#installation.

### Production
Build a release:

```bash
yarn release-electron
```
