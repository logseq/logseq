(ns frontend.components.journal-test
  (:require ["react" :as react]
            [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "journal-membership-test")

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
  (let [original-use-ref (gobj/get react "useRef")
        original-use-callback (gobj/get react "useCallback")
        original (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useRef" (fn [value] #js {:current value}))
    (gobj/set react "useCallback" (fn [callback _deps] callback))
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useRef" original-use-ref)
        (gobj/set react "useCallback" original-use-callback)
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

(deftest journals-request-one-complete-visible-window-test
  (async done
         (let [journal-a (random-uuid)
               journal-b (random-uuid)
               journal-a-bundle
               (bundle journal-a
                       {journal-a (block journal-a 1 "Journal A")}
                       {journal-a {:parent-tx-id 1 :items []}})
               pending-block-load (p/deferred)
               resource-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id resource-key]
                              (swap! resource-loads conj resource-key)
                              (case (first resource-key)
                                :journals
                                (p/resolved {:basis-rev 1
                                             :key resource-key
                                             :watch-keys #{[:journals]}
                                             :value {:journal-uuids [journal-a journal-b]
                                                     :bundles {journal-a journal-a-bundle}}})

                                :journal-window
                                (p/resolved {:basis-rev 1
                                             :key resource-key
                                             :watch-keys #{}
                                             :value {:bundles {}}})

                                (p/rejected
                                 (js/Error. "unexpected journal resource"))))
                            subs/<load-block
                            (fn [_graph-id _block-uuid]
                              pending-block-load)]
              (let [outer (mount-hook! db-hooks/use-resource [:journals 1])]
                (p/let [_ (p/delay 0)
                        _ (is (= [journal-a journal-b]
                                 (:journal-uuids @(:value outer))))
                        _ (is (= [[:journals 1]] @resource-loads))
                        mounted-page (mount-hook! db-hooks/use-block journal-a)
                        _ (p/delay 0)]
                  (is (= "Journal A" (:block/title @(:value mounted-page))))
                  (is (= [[:journals 1]] @resource-loads)
                      "The initial visible journal needs no per-item bundle request.")
                  (unmount! mounted-page)
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
