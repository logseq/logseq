(ns user
  "fns used on repl"
  (:require [clojure.test :refer [run-tests run-test]]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]
            [logseq.e2e.editor-test]
            [logseq.e2e.outliner-test]
            [logseq.e2e.rtc-basic-test]
            [logseq.e2e.fixtures :as fixtures]))

;; Use port 3001 for local testing
(reset! fixtures/*port 3001)
;; show ui
(reset! fixtures/*headless false)

(comment

  (future
    (fixtures/open-page
     repl/pause
     {:headless false}))

;; You can put `(repl/pause)` in any test to pause the tests,
  ;; this allows us to continue experimenting with the current page.
  (repl/pause)

  ;; To resume the tests, close the page/context/browser
  (repl/resume)

  ;; Run all the tests in specific ns with `future` to not block repl
  (future (run-tests 'logseq.e2e.editor-test))

  (future (run-tests 'logseq.e2e.outliner-test))

  (future (run-tests 'logseq.e2e.rtc-basic-test))

  ;; Run specific test
  (future (run-test logseq.e2e.editor-test/commands-test))

  ;; after the test has been paused, you can do anything with the current page like this
  (repl/with-page
    (w/wait-for (first (util/get-edit-block-container))
                {:state :detached}))

  ;;
  )
