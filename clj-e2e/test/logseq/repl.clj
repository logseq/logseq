(ns logseq.repl
  "fns used on repl"
  (:require [clojure.test :refer [run-tests run-test]]
            [wally.repl :as repl]))

(comment

  ;; You can put `(repl/pause)` in any test to pause the tests,
  ;; this allows us to continue experimenting with the current page.
  (repl/pause)

  ;; To resume the tests, close the page/context/browser
  (repl/resume)

  ;; Run all the tests in specific ns with `future` to not block repl
  (future (run-tests 'logseq.editor-test))

  ;; Run specific test
  (future (run-test logseq.editor-test/commands-test))

  ;; after the test has been paused, you can do anything with the current page like this
  (repl/with-page
    (press "Enter"))

  ;;
  )
