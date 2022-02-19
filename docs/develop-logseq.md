# Develop Logseq
### 1. Requirements

- [Node.js](https://nodejs.org/en/download/) (See [build.yml](.github/workflows/build.yml) for allowed version)  & [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Java & Clojure](https://clojure.org/guides/getting_started). (If you run into `Execution error (FileNotFoundException) at java.io.FileInputStream/open0 (FileInputStream.java:-2). -M:cljs (No such file or directory)`, it means you have a wrong Clojure version installed. Please uninstall it and follow the instructions linked.)

### 2. Compile to JavaScript

```bash
git clone https://github.com/logseq/logseq
cd logseq
yarn
yarn watch
```

### 3. Open the browser

Open <http://localhost:3001>.

### 4. Build a release

```bash
yarn release
```

### 5. Run tests

Run ClojureScript tests

```bash
yarn test
```

Run E2E tests

``` bash
yarn electron-watch
# in another shell
yarn e2e-test # or npx playwright test
```

## Desktop app development

### 1. Compile to JavaScript

```bash
yarn watch
```

### 2. Install npm packages for building the desktop app

``` bash
cd static && yarn install && cd ..
```

### 3. Open the dev app

```bash
yarn dev-electron-app
```

### 4. Build a release

```bash
yarn release-electron
```