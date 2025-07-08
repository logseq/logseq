# e2e

e2e tests for Logseq app.

## Usage

Before running tests, ensure the following:
* The app's js and css assets are built and located at ../public/.
* Those assets are served on http://localhost:3002/ via `bb serve`.

Then, run the project's tests:

    $ clojure -T:build test

If you would like to run individual tests, pass options to the test runner through `clojure -M:test`. For example, add a `^:focus` on a test and then run `clojure -M:test -i focus`.

If e2e tests fail, `clj-e2e/e2e-dump/` contains console logs and screenshots to help debug.