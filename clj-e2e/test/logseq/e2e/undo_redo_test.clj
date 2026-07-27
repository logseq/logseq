(ns logseq.e2e.undo-redo-test
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(deftest undo-redo-paste
  (testing "Undo redo paste blocks"
    (b/new-blocks ["b1" "b2"])
    (b/select-blocks 2)
    (b/copy)
    (b/new-block "")
    (b/paste)
    (util/exit-edit)
    (is (= ["b1" "b2" "b1" "b2"] (util/get-page-blocks-contents)))
    (b/undo)
    (util/exit-edit)
    (is (= ["b1" "b2" ""] (util/get-page-blocks-contents)))
    (b/redo)
    (util/exit-edit)
    (is (= ["b1" "b2" "b1" "b2"] (util/get-page-blocks-contents)))))

(deftest undo-latest-saved-block-content-once
  (testing "Undo reverts the latest saved block content on the first attempt"
    (b/new-blocks ["b1"])
    (util/wait-timeout 2000)
    (util/move-cursor-to-end)
    (util/press-seq " new text" :delay 20)
    (util/wait-timeout 1000)
    (b/undo)
    (util/exit-edit)
    (is (= ["b1"] (util/get-page-blocks-contents)))))

(deftest cut-and-paste-preserves-multiple-block-trees
  (testing "Cut waits for structured clipboard data before deleting nested blocks"
    (let [page-name (p/get-page-name)
          page-uuid (get (ls-api-call! :editor.getBlock page-name) "uuid")
          target-uuid (get (first (ls-api-call! :editor.getPageBlocksTree page-name))
                           "uuid")]
      (util/exit-edit)
      (ls-api-call! :editor.insertBatchBlock
                    page-uuid
                    [{:content "parent a"
                      :children [{:content "child a1"}
                                 {:content "child a2"}]}
                     {:content "parent b"
                      :children [{:content "child b1"}
                                 {:content "child b2"}]}])
      (w/click (util/get-by-text "child b2" true))
      (b/select-blocks 6)
      (k/press "ControlOrMeta+x" {:delay 100})
      (loop [remaining 50]
        (let [blocks (ls-api-call! :editor.getPageBlocksTree page-name)]
          (when (some #(not (string/blank? (get % "content"))) blocks)
            (when (zero? remaining)
              (throw (ex-info "Cut did not remove the selected block trees" {})))
            (util/wait-timeout 100)
            (recur (dec remaining)))))
      (w/click (format "#ls-block-%s .block-content" target-uuid))
      (b/paste)
      (util/exit-edit)
      (let [tree (loop [remaining 50]
                   (let [blocks (remove #(string/blank? (get % "content"))
                                        (ls-api-call! :editor.getPageBlocksTree page-name))]
                     (if (or (= 2 (count blocks)) (zero? remaining))
                       blocks
                       (do
                         (util/wait-timeout 100)
                         (recur (dec remaining))))))
            titles (fn [blocks]
                     (mapv #(get % "content") blocks))
            children (fn [block]
                       (titles (get block "children")))]
        (is (= ["parent a" "parent b"] (titles tree)))
        (is (= ["child a1" "child a2"] (children (first tree))))
        (is (= ["child b1" "child b2"] (children (second tree)))))
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible (util/get-by-text "parent a" true))
      (assert/assert-is-visible (util/get-by-text "parent b" true)))))
