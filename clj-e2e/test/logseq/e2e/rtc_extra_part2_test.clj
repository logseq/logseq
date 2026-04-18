(ns logseq.e2e.rtc-extra-part2-test
  (:require [clojure.java.io :as io]
            [clojure.string :as string]
            [clojure.test :refer [deftest testing is use-fixtures run-test]]
            [jsonista.core :as json]
            [logseq.e2e.block :as b]
            [logseq.e2e.const :refer [*page1 *page2 *graph-name*]]
            [logseq.e2e.custom-report :as custom-report]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.page :as page]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once
  fixtures/open-2-pages
  (partial fixtures/prepare-rtc-graph-fixture "rtc-extra-part2-test-graph"))

(use-fixtures :each
  fixtures/new-logseq-page-in-rtc)

(def ^:private stress-default-rounds 1)
(def ^:private stress-default-ops-per-client 50)
(def ^:private stress-default-seed-blocks 20)
(def ^:private stress-default-seed 20260330)
(def ^:private stress-max-seed-depth 4)
(def ^:private severe-sync-log-patterns
  ["db-sync/checksum-mismatch"
   "db-sync/tx-rejected"
   "db-sync/apply-remote-txs-failed"])
(def ^:private random-edit-actions
  [:new :save :indent-outdent :delete-existing :undo :redo])

(defn- env-int
  [k default]
  (let [raw (System/getenv k)]
    (if-not (string/blank? raw)
      (try
        (Integer/parseInt raw)
        (catch Throwable _
          default))
      default)))

(defn- recent-console-logs
  []
  (->> (some-> custom-report/*pw-page->console-logs* deref vals)
       (mapcat identity)
       vec))

(defn- assert-no-severe-sync-errors!
  []
  (let [logs (recent-console-logs)
        matched (->> logs
                     (filter (fn [line]
                               (some #(string/includes? line %) severe-sync-log-patterns)))
                     vec)]
    (is (empty? matched)
        (str "found severe sync errors in console logs: "
             (pr-str (take-last 20 matched))))))

(defn- page-sync-state
  [pw-page]
  (w/with-page pw-page
    (util/exit-edit)
    {:rtc-tx (rtc/get-rtc-tx)
     :blocks (util/get-page-blocks-contents)}))

(defn- assert-two-pages-synced!
  []
  (let [s1 (page-sync-state @*page1)
        s2 (page-sync-state @*page2)
        tx1 (:rtc-tx s1)
        tx2 (:rtc-tx s2)]
    (is (= (:blocks s1) (:blocks s2))
        (str "page blocks diverged: "
             (pr-str {:page1-count (count (:blocks s1))
                      :page2-count (count (:blocks s2))
                      :page1-tail (take-last 8 (:blocks s1))
                      :page2-tail (take-last 8 (:blocks s2))})))
    (is (= (:local-tx tx1) (:remote-tx tx1))
        (str "page1 rtc-tx not converged: " (pr-str tx1)))
    (is (= (:local-tx tx2) (:remote-tx tx2))
        (str "page2 rtc-tx not converged: " (pr-str tx2)))))

(defn- try-indent!
  []
  (if-let [editor (util/get-editor)]
    (let [[x1 _] (util/bounding-xy editor)]
      (k/tab)
      (if-let [editor' (util/get-editor)]
        (let [[x2 _] (util/bounding-xy editor')]
          (> x2 x1))
        false))
    false))

(defn- try-outdent!
  []
  (if-let [editor (util/get-editor)]
    (let [[x1 _] (util/bounding-xy editor)]
      (k/shift+tab)
      (if-let [editor' (util/get-editor)]
        (let [[x2 _] (util/bounding-xy editor')]
          (> x1 x2))
        false))
    false))

(defn- align-depth!
  [depth target]
  (loop [d depth]
    (cond
      (< d target) (if (try-indent!)
                     (recur (inc d))
                     d)
      (> d target) (if (try-outdent!)
                     (recur (dec d))
                     d)
      :else d)))

(defn- new-block-safe!
  [title]
  (loop [attempt 4]
    (let [created?
          (try
            (b/new-block title)
            true
            (catch Throwable _
              false))]
      (if created?
        true
        (if (zero? attempt)
          (throw (ex-info "new-block-safe failed" {:title title}))
          (do
            (util/exit-edit)
            (util/wait-timeout 80)
            (try
              (b/open-last-block)
              (catch Throwable _
                nil))
            (util/wait-timeout 80)
            (recur (dec attempt))))))))

(defn- sync-by-trigger!
  ([tag]
   (sync-by-trigger! tag nil))
  ([tag checkpoints]
   (let [target-tx (some->> checkpoints
                            vals
                            (filter integer?)
                            seq
                            (apply max))]
     ;; Ensure both pages have observed all prior edit/undo-redo txs first.
     (when target-tx
       (w/with-page @*page1
         (rtc/wait-tx-update-to target-tx))
       (w/with-page @*page2
         (rtc/wait-tx-update-to target-tx)))
     (let [{:keys [remote-tx]}
           (w/with-page @*page1
             (rtc/with-wait-tx-updated
               (new-block-safe! (str "sync-trigger-" tag))))]
       (w/with-page @*page1
         (rtc/wait-tx-update-to remote-tx))
       (w/with-page @*page2
         (rtc/wait-tx-update-to remote-tx))))))

(defn- seed-long-nested-page!
  [seed]
  (let [seed-blocks (max 20 (env-int "DB_SYNC_E2E_STRESS_SEED_BLOCKS" stress-default-seed-blocks))
        rng (java.util.Random. (long (+ seed 97)))]
    (let [titles
          (w/with-page @*page1
            (util/exit-edit)
            (loop [i 0
                   depth 0
                   titles #{}]
              (if (< i seed-blocks)
                (let [title (format "seed-r%s-%03d" seed i)
                      target-depth (.nextInt rng (inc stress-max-seed-depth))]
                  (new-block-safe! title)
                  (recur (inc i)
                         (align-depth! depth target-depth)
                         (conj titles title)))
                (do
                  (util/exit-edit)
                  titles))))]
      (sync-by-trigger! (str "seed-" seed))
      titles)))

(defn- next-action
  [rng]
  (nth random-edit-actions
       (.nextInt rng (count random-edit-actions))))

(defn- delete-existing-random-block!
  [rng known-titles]
  (loop [attempt 8]
    (if (zero? attempt)
      0
      (let [titles (vec @known-titles)]
        (if (empty? titles)
          0
          (let [title (nth titles (.nextInt rng (count titles)))
                deleted?
                (try
                  (b/jump-to-block title)
                  (b/delete-blocks)
                  true
                  (catch Throwable _
                    false))]
            (if deleted?
              (do
                (swap! known-titles disj title)
                1)
              (recur (dec attempt)))))))))

(defn- random-edit-op!
  [rng known-titles client-prefix round op-idx]
  (let [base (format "%s-r%s-op%s" client-prefix round op-idx)]
    (case (next-action rng)
      :new
      (let [title (str base "-new")]
        (new-block-safe! title)
        (swap! known-titles conj title)
        1)

      :save
      (let [save-title (str base "-save-updated")]
        (new-block-safe! (str base "-save"))
        (b/save-block save-title)
        (swap! known-titles conj save-title)
        2)

      :indent-outdent
      (let [title (str base "-nest")]
        (new-block-safe! title)
        (swap! known-titles conj title)
        (+ 1
           (if (try-indent!) 1 0)
           (if (try-outdent!) 1 0)))

      :delete-existing
      (delete-existing-random-block! rng known-titles)

      :undo
      (do
        (b/undo)
        0)

      :redo
      (do
        (b/redo)
        0))))

(defn- local-random-edit-batch!
  [rng known-titles client-prefix round]
  (let [ops (max 1 (env-int "DB_SYNC_E2E_STRESS_OPS_PER_CLIENT" stress-default-ops-per-client))]
    (loop [i 0
           undo-steps 0]
      (if (< i ops)
        (recur (inc i)
               (+ undo-steps
                  (random-edit-op! rng known-titles client-prefix round i)))
        (do
          (util/exit-edit)
          undo-steps)))))

(defn- local-undo-redo-batch!
  [undo-steps]
  (let [steps (max 1 undo-steps)]
    ;; Undo and redo exactly what this client edited in the current round.
    (b/open-last-block)
    (dotimes [_ steps]
      (b/undo))
    (dotimes [_ steps]
      (b/redo))
    (util/exit-edit)))

(def ^:private stress-client-op-timeout-ms 120000)

(defn- await-future!
  [f label]
  (let [result (deref f stress-client-op-timeout-ms ::timeout)]
    (when (= result ::timeout)
      (throw (ex-info "parallel client op timed out"
                      {:label label
                       :timeout-ms stress-client-op-timeout-ms})))
    result))

(defn- run-two-clients-in-parallel!
  [p1-fn p2-fn]
  (let [start-signal (promise)
        p1-future (future @start-signal (p1-fn))
        p2-future (future @start-signal (p2-fn))]
    (deliver start-signal true)
    [(await-future! p1-future :p1-op)
     (await-future! p2-future :p2-op)]))

(deftest online-two-clients-undo-redo-stress-test
  (testing "two online RTC clients survive random edits + undo/redo loops on a long nested page"
    (let [rounds (max 1 (env-int "DB_SYNC_E2E_STRESS_ROUNDS" stress-default-rounds))
          seed (long (env-int "DB_SYNC_E2E_STRESS_SEED" stress-default-seed))
          p1-rng (java.util.Random. (long (+ seed 101)))
          p2-rng (java.util.Random. (long (+ seed 202)))
          known-titles (atom (seed-long-nested-page! seed))]
      (dotimes [round rounds]
        (let [p1-undo-steps (atom 0)
              p2-undo-steps (atom 0)
              ;; Phase 1: edit batches in parallel with synchronized start.
              [_ _]
              (run-two-clients-in-parallel!
               #(w/with-page @*page1
                  (reset! p1-undo-steps
                          (local-random-edit-batch! p1-rng known-titles "p1" round)))
               #(w/with-page @*page2
                  (reset! p2-undo-steps
                          (local-random-edit-batch! p2-rng known-titles "p2" round))))
              p1-edit-remote-tx (w/with-page @*page1
                                  (-> (rtc/get-rtc-tx) :local-tx))
              p2-edit-remote-tx (w/with-page @*page2
                                  (-> (rtc/get-rtc-tx) :local-tx))
              ;; Phase 2: undo+redo batches in parallel with synchronized start.
              [_ _]
              (run-two-clients-in-parallel!
               #(w/with-page @*page1
                  (local-undo-redo-batch! @p1-undo-steps))
               #(w/with-page @*page2
                  (local-undo-redo-batch! @p2-undo-steps)))
              p1-undo-remote-tx (w/with-page @*page1
                                  (-> (rtc/get-rtc-tx) :local-tx))
              p2-undo-remote-tx (w/with-page @*page2
                                  (-> (rtc/get-rtc-tx) :local-tx))]

          (sync-by-trigger!
           round
           {:p1-edit p1-edit-remote-tx
            :p2-edit p2-edit-remote-tx
            :p1-undo p1-undo-remote-tx
            :p2-undo p2-undo-remote-tx})
          (assert-two-pages-synced!)
          (assert-no-severe-sync-errors!))))))

;;; https://github.com/logseq/db-test/issues/651
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
    (let [asset-file "../assets/icon.png"
          page-title (w/with-page @*page1 (page/get-page-name))]
      (w/with-page @*page1
        (let [p (w/get-page)]
          (.onFileChooser p (reify java.util.function.Consumer
                              (accept [_ fc]
                                (.setFiles fc (into-array java.nio.file.Path [(java.nio.file.Paths/get asset-file (into-array String []))])))))
          (b/new-block "asset block")
          (util/input-command "Upload an asset")
          (w/wait-for ".ls-block img")))

      (let [{:keys [remote-tx]}
            (w/with-page @*page1
              (rtc/with-wait-tx-updated
                (b/new-block "sync done")))]
        (w/with-page @*page2
          (rtc/wait-tx-update-to remote-tx)))

      (w/with-page @*page2
        (graph/remove-local-graph *graph-name*)
        (graph/wait-for-remote-graph *graph-name*)
        (graph/switch-graph *graph-name* true false)
        (page/goto-page page-title)
        (w/wait-for ".ls-block img")
        (is (some? (.getAttribute (w/-query ".ls-block img") "src"))))

      (rtc/validate-graphs-in-2-pw-pages))))

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
