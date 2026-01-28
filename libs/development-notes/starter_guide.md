# Logseq Plugin Starter Guide

# For Developers

In this short guide, it will walk you through the steps needed to set up your development environment for writing and
running a hello world simple inside of Logseq Desktop Client. You know Logseq Plugin based on Web Technologies composed
of JS & HTML & CSS, but neither are mandatory, you can develop plugins use any language which can be translated to
javascript (Logseq made by Clojurescript!). We will use Typescript to demonstrate this sample. Because there
is [a type definition file](https://www.npmjs.com/package/@logseq/libs) to make development experience even better.

## Install Node.js and NPM

You can download Node.js here, which will include NPM: https://nodejs.org/en/download/.

## Install TypeScript

To install TypeScript, run `npm install -g typescript` in a terminal.

## Get Logseq desktop app

At this time, plugin development and testing needs to be done using the Logseq desktop app. This is because Logseq needs
to read your code saved as a local file. The Logseq desktop app can be downloaded
here: https://github.com/logseq/logseq/releases.

If you already have the desktop app, please make sure to update to the latest version, as several features have been
added specifically in order to provide a better plugin development experience.

## Go to Settings > Turn on Developer Mode

This will bring up the "Plugins" entry in three dots more menu list on top right of head bar. Go to Plugins page, and
you will get a button with `Load unpacked plugin` label.

## Create plugin package from scaffold

We will use [logseq-hello-world](https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-hello-world) as
scaffold. Download this package files using Git or download zip straight to your own plugin package directory.

## Explain `package.json`

Generally Logseq plugin package is described by `package.json` file located root. Let's checkout these primary keys.

```json
{
  "name": "logseq-plugin-hello-world",
  "version": "0.0.1",
  "main": "dist/index.html",
  "logseq": {
    "id": "yet-another-hello-world-plugin",
    "title": "Say Hi to Logseq",
    "icon": "logseq.png"
  }
}
```

- __name__ [required] a name of plugin.
    - it starts with `logseq-plugin` is better for Googling.
- __version__ [required] semantic version
    - related link: https://semver.org/
- __main__ [optional] entry of plugin, optional for theme plugin only.
    - `.html` file entry indicate that the plugin provide main iframe ui.
    - `.js` file entry indicate that the plugin without main iframe ui.
- __logseq__ [required] specs of plugin & indicate it's a Logseq package.
    - `id` [optional] the identity key of plugin. if you don't provide it that will be auto generated on load
      development package.
    - `title` [optional] the title display of plugin list card. if not provided, value of `pkg#name` would be used.
    - `icon` [optional] plugin logo for your own brand :D.
    - `minSDKVersion` - [optional] the minimum sdk version what your plugin required. eg: `0.1.0`.
    - `supportsDB` - [optional] the boolean value indicate whether your plugin support the database feature.
    - `supportsDBOnly` - [optional] the boolean value indicate whether your plugin only support the database feature.

      Apart from these primary keys, you might find other useful fields, e.g. `author`, `description`, `repository`.
      Although these are not necessary, but completed fields are kind for your plugin users.

## Develop your code

This scaffold using [Parcel](https://v2.parceljs.org/) as `ts` bundler, just it works out of box. Of Course, you could
choose another one what you prefer. Then install dependencies `npm install` and watch your code in development mode
`npm run dev`. It will build the development version outputs to the dist directory. Go to plugins page and pick your
plugin root directory by `Load unpacked plugin` button. You will get a message from this plugin. Let's explain the entry
file of `index.ts`.

### 1. import user plugin SDK [required]

```js
import '@logseq/libs'
```

It provides TS types and global sdk namespace `logseq`.

### 2. bootstrap your main function [required]

```js
logseq.ready(main).catch(console.error)
```

Limited by the plugin system mechanism, user main function should wait for some preparations to make sure the SDK api
works correctly!

### 3. show your code [required]

```js
function main () {
  logseq.UI.showMsg('❤️  Message from Hello World Plugin :)')
}
```

Change your code and reload the plugin to make it works.

> If you develop main ui in iframe, [HMR](https://webpack.js.org/concepts/hot-module-replacement/) feature provided by
> some ui frameworks is convenient that can avoid reloading plugin again and again.

🎉 Actually, you're done!

## Next steps

- Awesome samples
    - https://github.com/logseq/logseq-plugin-samples
    - https://github.com/logseq/awesome-logseq
- Community plugins
    - https://github.com/search?q=logseq-plugin

# For users

Currently, Logseq plugin can only run in developer mode. Under this mode, plugin has ability to access notes data. So if
you're working with sensitive data, you'd better confirm the plugin is from trusted resource before installing it.