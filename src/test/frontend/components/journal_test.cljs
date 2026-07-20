(ns frontend.components.journal-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            ["react" :as react]
            [cljs.test :refer [async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "journal-membership-test")

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(defn- occurrence-count
  [source needle]
  (loop [start 0
         result 0]
    (if-let [index (string/index-of source needle start)]
      (recur (+ index (count needle)) (inc result))
      result)))

(defn- block
  [block-uuid tx-id title]
  {:block/uuid block-uuid
   :block/tx-id tx-id
   :block/title title})

(defn- bundle
  [root-uuid blocks children]
  {:root-uuid root-uuid
   :blocks blocks
   :children children})

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(defn- with-use-sync-external-store
  [replacement f]
  (let [original (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useSyncExternalStore" original)))))

(defn- mount-hook!
  "Mount one real renderer hook behind a minimal external-store harness."
  [hook key]
  (let [*mounted? (atom true)
        *unsubscribe (atom nil)
        value (atom nil)
        render-count (atom 0)]
    (letfn [(listener! []
              (when @*mounted?
                (render!)))
            (render! []
              (when @*mounted?
                (with-use-sync-external-store
                  (fn [subscribe get-snapshot _get-server-snapshot]
                    (when-not @*unsubscribe
                      (reset! *unsubscribe (subscribe listener!)))
                    (get-snapshot))
                  (fn []
                    (swap! render-count inc)
                    (reset! value (hook key))))))]
      (render!)
      {:value value
       :render-count render-count
       :unmount! (fn []
                   (reset! *mounted? false)
                   (when-let [unsubscribe @*unsubscribe]
                     (unsubscribe)
                     (reset! *unsubscribe nil)))})))

(defn- unmount!
  [mounted]
  ((:unmount! mounted)))

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest offscreen-journal-does-not-subscribe-its-bundle-test
  (async done
         (let [journal-a (random-uuid)
               journal-b (random-uuid)
               journal-a-bundle
               (bundle journal-a
                       {journal-a (block journal-a 1 "Journal A")}
                       {journal-a {:parent-tx-id 1 :items []}})
               resource-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id resource-key]
                              (swap! resource-loads conj resource-key)
                              (case (first resource-key)
                                :journals
                                (p/resolved {:basis-rev 1
                                             :key [:journals]
                                             :watch-keys #{[:journals]}
                                             :value [journal-a journal-b]})

                                :journal-bundle
                                (if (= journal-a (second resource-key))
                                  (p/resolved
                                   {:basis-rev 1
                                    :key [:journal-bundle journal-a]
                                    :watch-keys #{}
                                    :value journal-a-bundle})
                                  (p/rejected
                                   (js/Error. "offscreen journal loaded")))

                                (p/rejected
                                 (js/Error. "unexpected journal resource"))))]
              (let [outer (mount-hook! db-hooks/use-resource [:journals])]
                (p/let [_ (p/delay 0)
                        _ (is (= [journal-a journal-b] @(:value outer)))
                        _ (is (= [[:journals]] @resource-loads)
                              "Loading the outer UUID stream mounts no journal bundle.")
                        visible
                        (mount-hook! db-hooks/use-resource
                                     [:journal-bundle journal-a])
                        _ (p/delay 0)]
                  (is (= [[:journals] [:journal-bundle journal-a]]
                         @resource-loads))
                  (is (not-any? #{[:journal-bundle journal-b]}
                                @resource-loads)
                      "Only the Virtuoso-mounted journal item subscribes.")
                  (unmount! visible)
                  (unmount! outer))))))))

(deftest mounted-journal-bundle-seeds-its-entire-plain-tree-atomically-test
  (async done
         (let [journal-uuid (random-uuid)
               child-uuid (random-uuid)
               nested-uuid (random-uuid)
               resource-key [:journal-bundle journal-uuid]
               blocks {journal-uuid (block journal-uuid 10 "Journal")
                       child-uuid (block child-uuid 10 "Child")
                       nested-uuid (block nested-uuid 10 "Nested")}
               children
               {journal-uuid {:parent-tx-id 10
                              :items [[child-uuid "a"]]}
                child-uuid {:parent-tx-id 10
                            :items [[nested-uuid "a"]]}
                nested-uuid {:parent-tx-id 10
                             :items []}}
               expected-bundle (bundle journal-uuid blocks children)
               block-loads (atom [])
               children-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (p/resolved {:basis-rev 1
                                           :key requested-key
                                           :watch-keys #{}
                                           :value expected-bundle}))
                            subs/<load-block
                            (fn [_graph-id block-uuid]
                              (swap! block-loads conj block-uuid)
                              (p/rejected
                               (js/Error. "seeded block reloaded")))
                            subs/<load-children
                            (fn [_graph-id parent-uuid]
                              (swap! children-loads conj parent-uuid)
                              (p/rejected
                               (js/Error. "seeded membership reloaded")))]
              (let [bundle-mount
                    (mount-hook! db-hooks/use-resource resource-key)]
                (p/let [_ (p/delay 0)
                        _ (is (= expected-bundle @(:value bundle-mount)))
                        _ (doseq [[block-uuid expected-block] blocks]
                            (is (= {:status :ready :value expected-block}
                                   (subs/block-snapshot block-uuid))))
                        _ (doseq [[parent-uuid membership] children]
                            (is (= {:status :ready
                                    :value (mapv first (:items membership))}
                                   (subs/children-snapshot parent-uuid))))
                        block-mounts
                        (mapv #(mount-hook! db-hooks/use-block %) (keys blocks))
                        children-mounts
                        (mapv #(mount-hook! db-hooks/use-children %)
                              (keys children))
                        _ (p/delay 0)]
                  (is (empty? @block-loads)
                      "Canonical bundle blocks are ready before rows mount.")
                  (is (empty? @children-loads)
                      "Every direct membership, including leaves, is seeded atomically.")
                  (run! unmount! block-mounts)
                  (run! unmount! children-mounts)
                  (unmount! bundle-mount))))))))

(deftest journals-own-exactly-one-outer-virtuoso-test
  (let [source (source-for "src/main/frontend/components/journal.cljs")
        outer-source (form-source source "(hsx/defc all-journals")]
    (is (some? outer-source))
    (is (= 1 (occurrence-count source "ui/virtualized-list"))
        "The journal module contains exactly one Virtuoso.")
    (when outer-source
      (is (string/includes? outer-source ":div#journals"))
      (is (string/includes? outer-source
                            "(db-hooks/use-resource [:journals])"))
      (is (= 1 (occurrence-count outer-source "ui/virtualized-list"))
          "#journals has one and only one virtualization owner.")
      (is (string/includes? outer-source ":data (to-array journal-uuids)"))
      (is (string/includes? outer-source
                            ":compute-item-key (fn [_idx journal-uuid]"))
      (is (string/includes? outer-source
                            ":item-content (fn [idx journal-uuid]"))
      (is (string/includes? outer-source "journal-item"))
      (is (not (string/includes? outer-source "[:journal-bundle"))
          "The outer list subscribes only to journal membership."))))

(deftest journal-item-has-no-inner-virtualizer-test
  (let [source (source-for "src/main/frontend/components/journal.cljs")
        item-source (form-source source "(hsx/defc journal-item")]
    (is (some? item-source))
    (when item-source
      (is (string/includes? item-source
                            "(db-hooks/use-resource [:journal-bundle journal-uuid])"))
      (is (string/includes? item-source "page/journal-page"))
      (is (zero? (occurrence-count item-source "ui/virtualized-list"))
          "A mounted journal never creates an inner virtualizer.")
      (is (not (string/includes? item-source "page-root-virtual-list"))))))

(deftest mounted-journal-page-renders-direct-and-nested-membership-plainly-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        journal-page-source (form-source source "(hsx/defc journal-page")]
    (is (some? journal-page-source))
    (when journal-page-source
      (is (= #{"db-hooks/use-block" "db-hooks/use-children"}
             (set (re-seq #"db-hooks/[a-z-]+" journal-page-source))))
      (is (string/includes? journal-page-source "block/plain-block-list"))
      (is (not (string/includes? journal-page-source
                                 "block/page-root-virtual-list")))
      (is (zero? (occurrence-count journal-page-source
                                   "ui/virtualized-list"))
          "The outer journal stream is the only virtualizer."))))

(deftest journal-slot-observer-and-residency-layer-is-deleted-test
  (let [source (source-for "src/main/frontend/components/journal.cljs")
        journal-state-path
        (node-path/join (.cwd js/process)
                        "src/main/frontend/components/journal_state.cljs")]
    (testing "Virtuoso lifecycle replaces the manual slot/window subsystem"
      (doseq [forbidden ["journal-state"
                         "IntersectionObserver"
                         "ResizeObserver"
                         "js/setTimeout"
                         "journal-item-height"
                         "journal-slot"
                         "rootMargin"
                         "metadata-hydration-delay"
                         "keep-tree-resident"
                         "recent?"
                         "resident-block-tree"
                         "slot-load-now?"]]
        (is (not (string/includes? source forbidden))
            (str "Superseded journal lifecycle remains: " forbidden))))
    (is (false? (fs/existsSync journal-state-path))
        "The obsolete journal-state compatibility namespace is deleted.")))
