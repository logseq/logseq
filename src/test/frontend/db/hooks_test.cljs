(ns frontend.db.hooks-test
  (:require ["react" :as react]
            [cljs.test :refer [deftest is]]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]))

(defn- with-use-sync-external-store
  [replacement f]
  (let [original-use-ref (gobj/get react "useRef")
        original-use-callback (gobj/get react "useCallback")
        original-use-sync-external-store
        (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useRef" (fn [value] #js {:current value}))
    (gobj/set react "useCallback" (fn [callback _deps] callback))
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useRef" original-use-ref)
        (gobj/set react "useCallback" original-use-callback)
        (gobj/set react "useSyncExternalStore"
                  original-use-sync-external-store)))))

(defn- identical-deps?
  [left right]
  (and (= (alength left) (alength right))
       (every? true?
               (map identical? (array-seq left) (array-seq right)))))

(defn- with-render-hook-runtime
  [capture! f]
  (let [original-use-ref (gobj/get react "useRef")
        original-use-callback (gobj/get react "useCallback")
        original-use-sync-external-store
        (gobj/get react "useSyncExternalStore")
        refs (atom [])
        callbacks (atom [])
        ref-index (atom 0)
        callback-index (atom 0)
        previous-subscribe (atom nil)
        previous-unsubscribe (atom nil)
        listener (fn [])
        reset-render! (fn []
                        (reset! ref-index 0)
                        (reset! callback-index 0))]
    (gobj/set react "useRef"
              (fn [initial-value]
                (let [index @ref-index]
                  (swap! ref-index inc)
                  (or (get @refs index)
                      (let [ref #js {:current initial-value}]
                        (swap! refs assoc index ref)
                        ref)))))
    (gobj/set react "useCallback"
              (fn [callback deps]
                (let [index @callback-index
                      previous (get @callbacks index)
                      result (if (and previous
                                      (identical-deps? (:deps previous) deps))
                               (:callback previous)
                               callback)]
                  (swap! callback-index inc)
                  (swap! callbacks assoc index {:callback result :deps deps})
                  result)))
    (gobj/set react "useSyncExternalStore"
              (fn [subscribe get-snapshot get-server-snapshot]
                (capture! [subscribe get-snapshot get-server-snapshot])
                (when-not (identical? @previous-subscribe subscribe)
                  (when-let [unsubscribe @previous-unsubscribe]
                    (unsubscribe))
                  (reset! previous-subscribe subscribe)
                  (reset! previous-unsubscribe (subscribe listener)))
                (get-snapshot)))
    (try
      (f reset-render!)
      (finally
        (when-let [unsubscribe @previous-unsubscribe]
          (unsubscribe))
        (gobj/set react "useRef" original-use-ref)
        (gobj/set react "useCallback" original-use-callback)
        (gobj/set react "useSyncExternalStore"
                  original-use-sync-external-store)))))

(defn- fail-loader
  [& _]
  (throw (js/Error. "A UI hook must not invoke a loader or query closure")))

(deftest use-block-is-an-exact-external-store-adapter-test
  (let [block-uuid (random-uuid)
        snapshot {:status :ready
                  :value {:block/uuid block-uuid
                          :block/tx-id 42
                          :block/title "Block"}}
        captured (atom nil)
        snapshot-calls (atom [])
        subscription-calls (atom [])
        listener (fn [])
        unsubscribe (fn [])]
    (with-redefs [subs/block-snapshot
                  (fn [requested-uuid]
                    (swap! snapshot-calls conj requested-uuid)
                    snapshot)
                  subs/subscribe-block!
                  (fn [& args]
                    (swap! subscription-calls conj args)
                    unsubscribe)
                  subs/<load-block fail-loader]
      (with-use-sync-external-store
        (fn [subscribe get-snapshot get-server-snapshot]
          (reset! captured [subscribe get-snapshot get-server-snapshot])
          (get-snapshot))
        (fn []
          (is (= (:value snapshot) (db-hooks/use-block block-uuid)))
          (let [[subscribe get-snapshot get-server-snapshot] @captured]
            (is (fn? subscribe))
            (is (fn? get-snapshot))
            (is (fn? get-server-snapshot))
            (is (identical? unsubscribe (subscribe listener)))
            (is (= snapshot (get-snapshot)))
            (is (= snapshot (get-server-snapshot)))
            (is (= [[block-uuid listener]] @subscription-calls)
                "The component supplies only its UUID and React listener.")
            (is (= [block-uuid block-uuid block-uuid] @snapshot-calls))))))))

(deftest use-children-is-an-exact-external-store-adapter-test
  (let [parent-uuid (random-uuid)
        child-uuids [(random-uuid) (random-uuid)]
        snapshot {:status :ready :value child-uuids}
        captured (atom nil)
        snapshot-calls (atom [])
        subscription-calls (atom [])
        listener (fn [])
        unsubscribe (fn [])]
    (with-redefs [subs/children-snapshot
                  (fn [requested-uuid]
                    (swap! snapshot-calls conj requested-uuid)
                    snapshot)
                  subs/subscribe-children!
                  (fn [& args]
                    (swap! subscription-calls conj args)
                    unsubscribe)
                  subs/<load-children fail-loader]
      (with-use-sync-external-store
        (fn [subscribe get-snapshot get-server-snapshot]
          (reset! captured [subscribe get-snapshot get-server-snapshot])
          (get-snapshot))
        (fn []
          (is (= child-uuids (db-hooks/use-children parent-uuid)))
          (let [[subscribe get-snapshot get-server-snapshot] @captured]
            (is (identical? unsubscribe (subscribe listener)))
            (is (= snapshot (get-snapshot)))
            (is (= snapshot (get-server-snapshot)))
            (is (= [[parent-uuid listener]] @subscription-calls)
                "The component supplies only its parent UUID and React listener.")
            (is (= [parent-uuid parent-uuid parent-uuid] @snapshot-calls))))))))

(deftest use-resource-is-an-exact-external-store-adapter-test
  (let [journal-uuid (random-uuid)
        resource-key [:journal-bundle journal-uuid]
        snapshot {:status :ready
                  :value {:journal-uuid journal-uuid}}
        captured (atom nil)
        snapshot-calls (atom [])
        subscription-calls (atom [])
        listener (fn [])
        unsubscribe (fn [])]
    (with-redefs [subs/resource-snapshot
                  (fn [requested-key]
                    (swap! snapshot-calls conj requested-key)
                    snapshot)
                  subs/subscribe-resource!
                  (fn [& args]
                    (swap! subscription-calls conj args)
                    unsubscribe)
                  subs/<load-resource fail-loader]
      (with-use-sync-external-store
        (fn [subscribe get-snapshot get-server-snapshot]
          (reset! captured [subscribe get-snapshot get-server-snapshot])
          (get-snapshot))
        (fn []
          (is (= (:value snapshot) (db-hooks/use-resource resource-key)))
          (let [[subscribe get-snapshot get-server-snapshot] @captured]
            (is (identical? unsubscribe (subscribe listener)))
            (is (= snapshot (get-snapshot)))
            (is (= snapshot (get-server-snapshot)))
            (is (= [[resource-key listener]] @subscription-calls)
                "The component supplies only its declarative resource key and React listener.")
            (is (= [resource-key resource-key resource-key]
                   @snapshot-calls))))))))

(deftest equal-resource-keys-keep-stable-external-store-callbacks-test
  (let [journal-uuid (random-uuid)
        equal-key-a [:journal-bundle journal-uuid]
        equal-key-b (mapv identity equal-key-a)
        changed-key [:page-identity journal-uuid]
        subscription-calls (atom [])
        unsubscribe-calls (atom 0)
        snapshot-calls (atom [])
        callback-identities (atom [])]
    (is (not (identical? equal-key-a equal-key-b)))
    (with-redefs [subs/subscribe-resource!
                  (fn [resource-key _listener]
                    (swap! subscription-calls conj resource-key)
                    #(swap! unsubscribe-calls inc))
                  subs/resource-snapshot
                  (fn [resource-key]
                    (swap! snapshot-calls conj resource-key)
                    {:status :ready :value resource-key})]
      (with-render-hook-runtime
        #(swap! callback-identities conj %)
        (fn [reset-render!]
          (doseq [resource-key [equal-key-a equal-key-b changed-key]]
            (reset-render!)
            (db-hooks/use-resource resource-key))))
      (let [[first-callbacks equal-callbacks changed-callbacks]
            @callback-identities]
        (is (every? true? (map identical? first-callbacks equal-callbacks))
            "Equal declarative keys retain subscribe and snapshot callback identity.")
        (is (every? false? (map identical? equal-callbacks changed-callbacks))
            "A changed key replaces every key-capturing callback."))
      (is (= [equal-key-a changed-key] @subscription-calls)
          "React resubscribes only when the declarative key changes.")
      (is (= 2 @unsubscribe-calls)
          "The changed subscription and final test cleanup each unsubscribe once.")
      (is (= [equal-key-a equal-key-a changed-key] @snapshot-calls)
          "Equal rerenders keep reading through the equality-stabilized key.")
      (is (identical? equal-key-a (second @snapshot-calls))
          "The stable callbacks retain the first equal key instance."))))

(deftest exact-hooks-hide-loading-state-and-surface-errors-test
  (let [block-uuid (random-uuid)
        error (js/Error. "worker load failed")]
    (with-use-sync-external-store
      (fn [_subscribe get-snapshot _get-server-snapshot]
        (get-snapshot))
      (fn []
        (with-redefs [subs/block-snapshot (constantly {:status :loading})]
          (is (nil? (db-hooks/use-block block-uuid))))
        (with-redefs [subs/block-snapshot (constantly {:status :missing})]
          (is (nil? (db-hooks/use-block block-uuid))))
        (with-redefs [subs/block-snapshot (constantly {:status :error
                                                       :error error})]
          (is (thrown? js/Error
                       (db-hooks/use-block block-uuid))))))))
