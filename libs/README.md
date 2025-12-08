## @logseq/libs

🚀 Logseq SDK libraries.

#### Installation

```shell
yarn add @logseq/libs
```

#### Usage

Load `logseq` plugin sdk as global namespace

```js
import "@logseq/libs"
```

#### APIs & Samples
- https://logseq.github.io/plugins/
- https://github.com/logseq/logseq-plugin-samples

#### Community templates

1. https://github.com/pengx17/logseq-plugin-template-react
2. https://github.com/pengx17/logseq-plugin-template-svelte
3. https://github.com/tiensonqin/logseq-cljs-playground
4. https://github.com/YU000jp/logseq-plugin-sample-kit-typescript

#### Feedback
If you have any feedback or encounter any issues, feel free to join Logseq's discord group.
https://discord.gg/KpN4eHY

#### Generate CLJS SDK wrappers

To regenerate the ClojureScript facade from the JS SDK declarations (keeping the same argument shapes as the JS APIs while auto-converting to/from CLJS data):

```bash
yarn run generate:schema              # emits dist/logseq-sdk-schema.json
bb libs:generate-cljs-sdk            # emits logseq/core.cljs and per-proxy files under target/generated-cljs
```

Non-proxy methods (those defined on `ILSPluginUser`, e.g. `ready`, `provide-ui`) land in `logseq.core`. Each proxy (`IAppProxy`, `IEditorProxy`, ...) is emitted to its own namespace such as `logseq.app` or `logseq.editor`, preserving the original JS argument ordering while automatically bean-converting CLJS data.

Pass `--out-dir` to change the output location or `--ns-prefix` to pick a different namespace root.
