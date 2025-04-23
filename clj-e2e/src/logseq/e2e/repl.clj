(ns logseq.e2e.repl
  "fns used on repl"
  (:require [clojure.test :refer [run-tests run-test]]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(comment

  (future
    (w/with-page-open
      (w/make-page {:headless false
                    :persistent false
                    :slow-mo 20})
      (w/navigate "http://localhost:3001")
      (repl/pause)))

  ;; You can put `(repl/pause)` in any test to pause the tests,
  ;; this allows us to continue experimenting with the current page.
  (repl/pause)

  ;; To resume the tests, close the page/context/browser
  (repl/resume)

  ;; Run all the tests in specific ns with `future` to not block repl
  (future (run-tests 'logseq.e2e.editor-test))
  (future (run-tests 'logseq.e2e.outliner-test))

  ;; Run specific test
  (future (run-test logseq.e2e.editor-test/commands-test))

  ;; after the test has been paused, you can do anything with the current page like this
  (repl/with-page
    (w/wait-for (first (util/get-edit-block-container))
                {:state :detached}))

  ;;
  )
