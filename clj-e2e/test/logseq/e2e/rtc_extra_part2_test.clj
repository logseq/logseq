(ns logseq.e2e.rtc-extra-part2-test
  (:require [clojure.java.io :as io]
            [clojure.string :as string]
            [clojure.test :as t :refer [deftest testing is use-fixtures run-test]]
            [jsonista.core :as json]
            [logseq.e2e.block :as b]
            [logseq.e2e.const :refer [*page1 *page2 *graph-name*]]
            [logseq.e2e.assets :as e2e-assets]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.page :as page]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(def ^:private only-asset-restore-test?
  (= "1" (System/getenv "LOGSEQ_E2E_ONLY_ASSET_RESTORE")))

(use-fixtures :once
  fixtures/open-2-pages
  (partial fixtures/prepare-rtc-graph-fixture "rtc-extra-part2-test-graph"))

(use-fixtures :each
  fixtures/new-logseq-page-in-rtc)

;;; https://github.com/logseq/db-test/issues/651
(defn test-ns-hook
  []
  (let [ns-obj (the-ns 'logseq.e2e.rtc-extra-part2-test)]
    (if only-asset-restore-test?
      (let [v (ns-resolve ns-obj 'asset-blocks-validate-after-init-downloaded-test)]
        (when-not (var? v)
          (throw (ex-info "missing asset restore test var" {:var v})))
        (t/test-vars [v]))
      (t/test-all-vars ns-obj))))

(deftest issue-651-block-title-double-transit-encoded-test
  (testing "
1. create pages named \"bbb\", \"aaa\", and turn these pages into tag
2. set \"bbb\" parent to \"aaa\"
3. create a new page \"ccc\", and create a simple query with filter tags = aaa/bbb
wait for 5-10 seconds, will found that \"aaa/bbb\" became \"aaa/<encrypted-string>\"
"
    (w/with-page @*page1
      (page/new-page "aaa")
      (page/convert-to-tag "aaa")
      (page/new-page "bbb")
      (page/convert-to-tag "bbb" :extends ["aaa"])
      (page/new-page "ccc")
      (b/new-block "")
      (util/input-command "query")
      (w/click (util/-query-last "button:text('filter')"))
      (util/input "tags")
      (w/click "a.menu-link:has-text('tags')")
      (w/click "a.menu-link:has-text('bbb')")
      (util/wait-timeout 5000)          ;as described in issue-url
      )
    (let [{:keys [remote-tx]}
          (w/with-page @*page1
            (rtc/with-wait-tx-updated
              (b/new-block "done")))]
      (w/with-page @*page2
        (rtc/wait-tx-update-to remote-tx)))

;; check 'aaa/bbb' still exists
    (w/with-page @*page1
      (page/goto-page "aaa/bbb"))
    (w/with-page @*page2
      (page/goto-page "aaa/bbb"))

    (rtc/validate-graphs-in-2-pw-pages)))

(deftest paste-multiple-blocks-test
  (testing "
1. create 3 blocks
  - block1
  - block2
  - block3
2. copy these 3 blocks
3. when cursor at block3, press <enter> to create a new block
4. paste them at current position 5 times
5. validate blocks are same on both clients"
    (w/with-page @*page1
      (b/new-blocks ["block1" "block2" "block3"])
      (util/exit-edit)
      (b/select-blocks 2)
      (b/copy)
      (b/jump-to-block "block3")
      (util/repeat-keyboard 1 "Enter"))

    (dotimes [_ 5]
      (let [{:keys [remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (b/paste)))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx))))

    (let [{:keys [remote-tx]}
          (w/with-page @*page1
            (rtc/with-wait-tx-updated
              (b/new-block "sync-trigger")))]
      (w/with-page @*page2
        (rtc/wait-tx-update-to remote-tx)))

    (let [expected (vec (concat ["block1" "block2" "block3"]
                                (take (* 3 5) (cycle ["block1" "block2" "block3"]))
                                ["sync-trigger"]))]
      (w/with-page @*page1
        (util/exit-edit)
        (is (= expected
               (util/get-page-blocks-contents))))

      (w/with-page @*page2
        (util/exit-edit)
        (is (= expected
               (util/get-page-blocks-contents)))))

    (rtc/validate-graphs-in-2-pw-pages)))

(deftest asset-blocks-validate-after-init-downloaded-test
  (testing "
- add some assets in client1
- remove local graph in client2
- re-download the remote graph in client2
- compare asset-blocks data in both clients"
    (let [temp-asset-path (java.nio.file.Files/createTempFile
                           "logseq-e2e-asset-"
                           ".txt"
                           (into-array java.nio.file.attribute.FileAttribute []))
          _ (spit (.toFile temp-asset-path)
                  (str "logseq e2e asset " (System/currentTimeMillis)))
          asset-path temp-asset-path
          page-title (w/with-page @*page1 (page/get-page-name))
          asset-block-uuid* (atom nil)
          asset-filename* (atom nil)]
      (w/with-page @*page1
        (let [p (w/get-page)]
          ;; Create a new empty block first. Asset insert behaves differently
          ;; based on whether the current block is empty.
          (b/open-last-block)
          (k/enter)
          (util/wait-editor-visible)
          (let [before (e2e-assets/list-assets *graph-name*)
                chooser (.waitForFileChooser
                         p
                         (reify Runnable
                           (run [_]
                             (util/input-command "Upload an asset"))))]
            (.setFiles chooser (into-array java.nio.file.Path [asset-path]))
            ;; Prefer inspecting lightning-fs directly. UI rendering can lag,
            ;; and reused graphs can already contain older assets.
            (let [filename (e2e-assets/wait-for-new-asset! *graph-name* before 60000)
                  asset-block-uuid (some-> filename (string/replace #"\.[^.]+$" ""))]
              (reset! asset-block-uuid* asset-block-uuid)
              (reset! asset-filename* filename)
              (is (string? asset-block-uuid)
                  (pr-str {:graph *graph-name*
                           :asset-block-uuid asset-block-uuid
                           :assets-before (vec before)
                           :assets (e2e-assets/list-assets *graph-name*)}))
              ;; Local sanity: the uploader should have written bytes locally.
              (is (true? (e2e-assets/wait-for-asset! *graph-name* filename 60000))
                  (pr-str {:graph *graph-name*
                           :asset-block-uuid asset-block-uuid
                           :asset-filename filename
                           :assets (e2e-assets/list-assets *graph-name*)}))))))

      (let [{:keys [remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (b/new-block "sync done")))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx)))

      (w/with-page @*page2
        (let [asset-filename @asset-filename*
              asset-block-uuid @asset-block-uuid*]
          (is (string? asset-filename))
          ;; Precondition: the asset *block* is synced to client2. The bytes may
          ;; or may not have been downloaded yet, depending on the build.
          (page/goto-page page-title)
          (w/wait-for (format ".ls-block[blockid='%s']" asset-block-uuid)
                      {:timeout 60000})

          (graph/remove-local-graph *graph-name*)
          (e2e-assets/clear-assets-dir! *graph-name*)
          (is (not (some #(= asset-filename %) (e2e-assets/list-assets *graph-name*)))
              (pr-str {:graph *graph-name* :asset-filename asset-filename}))

          (graph/wait-for-remote-graph *graph-name*)
          (graph/switch-graph *graph-name* true true)

          ;; Regression assertion: assets should be restored as part of the
          ;; download flow (no "visit each asset page to trigger download").
          (let [preloaded? (e2e-assets/wait-for-asset! *graph-name* asset-filename 120000)]
            (when-not preloaded?
              (page/goto-page page-title)
              (let [demand-loaded? (e2e-assets/wait-for-asset! *graph-name* asset-filename 60000)]
                (is (true? preloaded?)
                    (pr-str {:graph *graph-name*
                             :asset-block-uuid asset-block-uuid
                             :asset-filename asset-filename
                             :reason (if demand-loaded?
                                       :downloaded-only-after-page-visit
                                       :asset-never-downloaded)
                             :assets (e2e-assets/list-assets *graph-name*)}))))

            (page/goto-page page-title)
            ;; UI sanity: the asset block is present on the page.
            (w/wait-for (format ".ls-block[blockid='%s']" asset-block-uuid)
                        {:timeout 60000}))))

      (when-not only-asset-restore-test?
        (rtc/validate-graphs-in-2-pw-pages)))))

(deftest issue-683-paste-large-block-test
  (testing "Copying and pasting a large block of text into sync-ed graph causes sync to fail"
    (let [large-text (slurp (io/resource "large_text.txt"))]
      (w/with-page @*page1
        (w/eval-js (str "navigator.clipboard.writeText(" (json/write-value-as-string large-text) ")")))
      (let [{:keys [remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (b/new-block "")
                (b/paste)))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx)))

      (rtc/validate-graphs-in-2-pw-pages))))
