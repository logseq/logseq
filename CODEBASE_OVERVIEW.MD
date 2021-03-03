# LogSeq Codebase Overview

When it comes to technologies and architectures, LogSeq (the single page application) is an unusual one. Except for using the popular React framework as the view layer, all aspects of it are somewhat less common.

To contribute, read the [README](https://github.com/logseq/logseq) first. If you want to learn more about how LogSeq works, we hope this document will provide some guidance.

## Tech Stack

### Clojure/ClojureScript

Nowadays compile-to-js are common practice. With the advent of web assembly, you can use almost any language to write browser apps.

Simply put, Clojure is a dynamic typing functional programming language, with Lisp's syntax, running on the JVM. ClojureScript is just Clojure compiling to JavaScript.

Clojure is easy to learn, you can pick it up pretty quickly following the [official guide](https://clojure.org/guides/learn/syntax).

LogSeq chose ClojureScript not only because of all the [benefits](https://clojure.org/about/rationale) of the language itself but also because of the awesome [DataScript](https://github.com/tonsky/datascript) library. More on that later.

### Shadow-cljs and Gulp

In a typical frontend project today, people use webpack (or other similar tools if you are adventurous) to bundle all your assets together. It's so powerful that it does much more than that. For example, it can transpile or minify your code through middlewares, and it also provides a dev server.

In ClojureScript we have shadow-cljs. It provides many of the same features as Webpack, such as building, bundling, hot reloading, and even code splitting.

For other tasks like bundling static resources and building the desktop app, which are not covered by shadow-cljs, LogSeq uses the good old [Gulp](https://gulpjs.com).

### Rum

[Rum](https://github.com/tonsky/rum) is a React wrapper in ClojureScript. More than just providing the familiar React APIs, Rum adds many Clojure flavors to React, especially on the state management part. As a result, if you have experience with React, read Rum's [README]((https://github.com/tonsky/rum) before diving into the code.

### DataScript

[DataScript](https://github.com/tonsky/datascript) is an in-memory database that implements the [Datalog](https://en.wikipedia.org/wiki/Datalog) logic programming language. Datalog is very different from and much more expressive than the more common SQL and NoSQL query languages. Many users have implemented interesting features on top of LogSeq just by utilizing the rich query language!

## Important Folders and Files

After cloning the [LogSeq repository](https://github.com/logseq/logseq), there are some folders and files that deserve extra attention.

- Config files are located at the root directory. `package.json` contains the JavaScript dependencies while `deps.edn` contains their Clojure counterparts. `shadow-cljs.edn` and `gulpfile.js` contain all the build scripts.

- `/src` is the main course. `/src/main/frontend` contains code that powers the LogSeq editor, most of the work are done there. `/src/electron` and `/src/main/electron` contains code specific to the desktop app. `src/test` contains all the test and `/src/dev-cljs` contains some development utilities.

- `/public` contains all the static assets

## Data Flow

LogSeq is undergoing rapid changes. Trying to cover its architecture comprehensively is hard at this moment. We just focus on the simplified version of its data flow to give you a glimpse of how LogSeq works internally.

### Application State

Most of LogSeq's application state is divided into two parts. Document-related state (all your pages, blocks, and contents) is stored in DataScript. UI-related state (such as the current editing block) is kept in Clojure's [atom](https://clojure.org/reference/atoms). We then use Rum's reactive component to subscribe to these states. React efficiently re-renders after state changes.

### When the App Starts

LogSeq loads files from your computer or the cloud, depending on your usage. The files are then parsed (and might be decrypted) and stored in DataScript. Other UI-related states are initialized. React components render for the first time. Event handlers are registered. You are ready to write your exciting notes!

### When you Type Something in the Document

It's the typical flow of an event-driven GUI application. Various handlers (which are just functions) are listening for events like drag and drop, edit, format, and so on. When you start typing, the handler for editing blocks is called. It does three things:

- Save your work to the disk or the cloud, so you won't lose them in case of an emergent power off.
- Update the UI state.
- Run transactions to update the DataScript database. Since other parts of the app may use data that are affected by the change, we need to rebuild the database query cache.

After the change changes, React will dutifully refresh the screen.

## What's more

We only cover essential parts of the LogSeq codebase to help you get started. Some interesting parts are left out and maybe explained more in the future:

- core data structure
- parsing
- integration with backend
- encryption
