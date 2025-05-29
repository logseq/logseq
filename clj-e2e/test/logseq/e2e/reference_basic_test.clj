(ns logseq.e2e.reference-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.util :as util]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

;; block references
(deftest self-reference
  (testing "self reference"
    (b/new-block "b2")
    (b/copy)
    (b/paste)
    (util/exit-edit)
    (assert/assert-selected-block-text "b2")))

(deftest self-tag-block-reference
  (testing "self reference"
    (b/new-block "b2")
    (util/set-tag "task")
    (b/copy)
    (b/paste)
    (util/exit-edit)
    (assert/assert-selected-block-text "b2")))

(deftest mutual-reference
  (testing "mutual reference"
    (b/new-blocks ["b1" "b2"])
    (util/set-tag "task")
    (b/copy)
    (k/arrow-up)
    (b/wait-editor-text "b1")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b2]]" "b2[[b1]]"])))

(deftest parent-reference
  (testing "parent reference"
    (b/new-blocks ["b1" "b2"])
    (util/set-tag "task")
    (b/indent)
    (b/copy)
    (k/arrow-up)
    (b/wait-editor-text "b1")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b2]]" "b2[[b1]]"])))

(deftest cycle-reference
  (testing "cycle reference"
    (b/new-blocks ["b1" "b2" "b3"])
    (util/set-tag "task")
    (b/jump-to-block "b1")
    (assert/assert-editor-mode)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b3")
    (b/paste)
    (b/copy)
    (b/jump-to-block "b1")
    (assert/assert-editor-mode)
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b3[[b2]]]]" "b2[[b1[[b3]]]]" "b3[[b2[[b1]]]]"])))

;; TODO: page references
