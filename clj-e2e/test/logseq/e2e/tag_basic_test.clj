(ns logseq.e2e.tag-basic-test
  (:require [clojure.test :refer [deftest testing is use-fixtures run-test run-tests]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn add-new-tags
  [title-prefix]
  (b/new-block (str title-prefix 1 " #" title-prefix "1"))
  (k/esc)
  (assert/assert-non-editor-mode)
  (b/new-block (str title-prefix 2))
  (util/set-tag (str title-prefix 2)))

(deftest new-tag-test
  (add-new-tags "tag-test-"))
