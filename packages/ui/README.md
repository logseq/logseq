## Logseq UI

Logseq UI components based on shadcn UI.

### Development

#### 🎨 Add a new component

It is recommended to install through CLI mode.

```shell
npx shadcn-ui@latest add button
```

#### 🦄 Play with Storybook
1. Watch shui cljs stories from root [scripts](https://github.com/logseq/logseq/blob/15be34fc5c79ccef9e7756131f54436763f36699/package.json#L59).

```shell
yarn run cljs:watch-stories

# cljs:watch-stories: "clojure -M:cljs watch stories-dev"
```

2. Set up storybook from the current working directory.

```shell
yarn run watch:storybook
```

### Credits

- https://ui.shadcn.com/
- https://www.radix-ui.com/

### License
MIT

