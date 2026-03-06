# e2e

e2e tests for Logseq app.

## Prerequisites

* The app's JS and CSS assets are built and located at `../static/`.
* [Babashka](https://github.com/babashka/babashka) is installed.

## Setup

Serve the static assets (default port 3002):

    $ bb serve

To use a custom port:

    $ bb serve --port 3001
    $ bb serve -p 3001

## Running Tests

Run all tests (namespaces ending in `-basic-test`):

    $ bb test

Run a single test namespace:

    $ bb test -n logseq.e2e.editor-basic-test

Run a single test function:

    $ bb test -v logseq.e2e.editor-basic-test/toggle-between-page-and-block

Filter by metadata tag (e.g. `^:focus`):

    $ bb test -i focus

Combine namespace and tag filters:

    $ bb test -n logseq.e2e.editor-basic-test -i focus

Run tests against a custom port:

    $ bb test -p 3001

Run tests and serve together (starts both in parallel):

    $ bb dev
    $ bb dev -p 3001

## How `-i` Works

The `-i`/`--include` flag is a [cognitect test-runner](https://github.com/cognitect-labs/test-runner) option. It filters tests by Clojure metadata key. Add `^:focus` to any `deftest` and pass `-i focus` to run only those tests:

```clojure
(deftest ^:focus my-test
  ...)
```

## RTC Tests

Run RTC extra tests (served + tested in parallel):

    $ bb run-rtc-extra-test
    $ bb run-rtc-extra-part2-test

## Debugging

When tests fail, `clj-e2e/e2e-dump/` contains console logs and screenshots.
