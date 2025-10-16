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

To regenerate the ClojureScript facade from the JS SDK declarations:

```bash
yarn run generate:schema              # emits dist/logseq-sdk-schema.json
bb libs:generate-cljs-sdk            # writes per-proxy CLJS under target/generated-cljs
```

Each interface is emitted to its own namespace (e.g. `logseq.app`, `logseq.editor`).
Pass `--out-dir` to change the output directory or `--ns-prefix` to use a different namespace root.
