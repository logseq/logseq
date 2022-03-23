## Description

This demonstrates running playwright tests with https://github.com/babashka/nbb.

_Note_: This only runs example browser tests. There is more work to run a basic electron test

## Setup
Install dependencies: `yarn install`

## Usage

Run tests: `yarn nbb -m test-runner`

Run headless tests: `CI=1 yarn nbb -m test-runner`

`nbb` supports repl driven development. See `yarn nbb -h` for different ways to
start a repl. See links below for examples of repl usage.


## Links
* https://github.com/nextjournal/clerk/pull/97/files
* https://github.com/babashka/nbb/tree/main/examples/playwright
