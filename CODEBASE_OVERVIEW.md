# Logseq Codebase Overview

This document helps you understand more about how Logseq works. To contribute, read the [README](https://github.com/logseq/logseq) first.

## Tech Stack

### Clojure/ClojureScript

Nowadays compile-to-js are common practice. With the advent of web assembly, you can use almost any language to write browser apps. The Logseq app mostly uses Clojure.

Simply put, Clojure is a dynamic typing functional programming language, with Lisp's syntax, running on the JVM. ClojureScript is just Clojure compiling to JavaScript.

Clojure is easy to learn, you can pick it up pretty quickly following the [official guide](https://clojure.org/guides/learn/syntax).

Logseq chose ClojureScript not only because of all the [benefits](https://clojure.org/about/rationale) of the language itself but also because of its awesome ecosystem, such as the [DataScript](https://github.com/tonsky/datascript) library. More on that later.

### Build Tools

Shadow-cljs is a tool that helps compiling the ClojureScript code to JavaScript. In addition, it supports more handy features like live reload, code splitting, REPL, etc.

For other tasks like bundling static resources and building the desktop app, which is not covered by shadow-cljs, Logseq uses the good old [Gulp](https://gulpjs.com).

### React & Rum

[React](https://reactjs.org/) is a library for building data-driven UI declaratively. Comparing to the imperative ways (such as DOM manipulation or using jQuery), it's simpler and easier to code correctly.

[Rum](https://github.com/tonsky/rum) is a React wrapper in ClojureScript. More than just providing the familiar React APIs, Rum adds many Clojure flavors to React, especially on the state management part. As a result, if you have experience with React, read Rum's [README](https://github.com/tonsky/rum) before diving into the code.

### DataScript

[DataScript](https://github.com/tonsky/datascript) is an in-memory database that implements the [Datalog](https://en.wikipedia.org/wiki/Datalog) logic programming language. Datalog is very different from and much more expressive than the more common SQL and NoSQL query languages. Many users have implemented interesting features on top of Logseq just by utilizing the rich query language. Get started with Datalog with this [tutorial](http://www.learndatalogtoday.org/)

## Important Folders and Files

After cloning the [Logseq repository](https://github.com/logseq/logseq), there are some folders and files that deserve extra attention.

- Config files are located at the root directory. `package.json` contains the JavaScript dependencies while `deps.edn` contains their Clojure counterparts. `shadow-cljs.edn` and `gulpfile.js` contain all the build scripts.

- `public/` and `resources/` contain all the static assets

- `src/` is where most of the code is located.

  - `src/electron/` and `src/main/electron/` contains code specific to the desktop app.

  - `src/test/` contains all the tests and `src/dev-cljs/` contains some development utilities.

  - `src/resources/` - directory and classpath for resources used by Clojure(Script)

  - `src/main/frontend/` contains code that powers the Logseq editor. Folders and files inside are organized by features or functions. For example, `components` contains all the UI components and `handler` contains all the event-handling code. You can explore on your own interest.

  - `src/main/logseq/` contains the api used by plugins.

- `deps/` contains dependencies or libraries used by the frontend.

  - `deps/graph-parser/` is a library that parses a Logseq graph and saves it to a database.

## Data Flow

### Application State

Most of Logseq's application state is divided into two parts. Document-related state (all your pages, blocks, and contents) is stored in DataScript. UI-related state (such as the current editing block) is kept in Clojure's [atom](https://clojure.org/reference/atoms). We then use Rum's reactive component to subscribe to these states. React efficiently re-renders after state changes.

### When the App Starts

Logseq loads files from your computer or the cloud, depending on your usage. The files are then parsed (and might be decrypted) and stored in DataScript. Other UI-related states are initialized. React components render for the first time. Event handlers are registered.

### When you Type Something in the Document

It's the typical flow of an event-driven GUI application. Various handlers (which are just functions) are listening for events like drag and drop, edit, format, and so on. When you start typing, the handler for editing blocks is called. It does three things:

- Save your work to the disk or the cloud, so you won't lose them in case of an emergent power off.
- Update the UI state.
- Run transactions to update the DataScript database. Since other parts of the app may use data that are affected by the change, we need to rebuild the database query cache.

After the change changes, React will dutifully refresh the screen.

## Architecture

Logseq has undergone a heavy refactoring, results in a much more robust and clear architecture. Read [this article](https://docs.logseq.com/#/page/The%20Refactoring%20Of%20Logseq) written by the main contributor to the refactoring for a detailed tour.
