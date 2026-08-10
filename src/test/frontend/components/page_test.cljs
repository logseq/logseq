(ns frontend.components.page-test
  (:require ["react" :as react]
            [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "page-membership-test")

(defn- block
  [block-uuid tx-id title]
  {:block/uuid block-uuid
   :block/tx-id tx-id
   :block/title title})

(defn- delta
  [rev overrides]
  (merge {:graph-id test-graph-id
          :rev rev
          :op-id (str "operation-" rev)
          :blocks {}
          :deleted {}
          :children {}
          :affected-keys #{}}
         overrides))

(defn- block-patch
  [basis-rev blocks]
  {:basis-rev basis-rev
   :slots (into {}
                (map (fn [[block-uuid block-value]]
                       [[:block block-uuid] {:value block-value}]))
                blocks)})

(defn- children-patch
  [basis-rev parent-uuid tx-id items]
  {:basis-rev basis-rev
   :slots {[:children parent-uuid] {:tx-id tx-id :items items}}})

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

(defn- mount-normal-page!
  "Mount the exact page and direct-membership hooks without a DOM renderer."
  [page-uuid]
  (let [*mounted? (atom true)
        *subscriptions (atom {})
        *hook-index (atom 0)
        render-count (atom 0)
        notification-count (atom 0)
        last-render (atom nil)]
    (letfn [(listener! []
              (when @*mounted?
                (swap! notification-count inc)
                (render!)))
            (render! []
              (when @*mounted?
                (reset! *hook-index 0)
                (with-use-sync-external-store
                  (fn [subscribe get-snapshot _get-server-snapshot]
                    (let [index @*hook-index]
                      (swap! *hook-index inc)
                      (when-not (contains? @*subscriptions index)
                        (swap! *subscriptions assoc index
                               (subscribe listener!)))
                      (get-snapshot)))
                  (fn []
                    (let [page (db-hooks/use-block page-uuid)
                          root-uuids (db-hooks/use-children page-uuid)]
                      (swap! render-count inc)
                      (reset! last-render
                              {:page page
                               :root-uuids root-uuids}))))))]
      (render!)
      {:last-render last-render
       :render-count render-count
       :notification-count notification-count
       :scroll! render!
       :unmount! (fn []
                   (reset! *mounted? false)
                   (doseq [unsubscribe (vals @*subscriptions)]
                     (unsubscribe))
                   (reset! *subscriptions {}))})))

(defn- unmount!
  [mounted]
  ((:unmount! mounted)))

(defn- order-key
  [index]
  (.padStart (str index) 5 "0"))

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest normal-page-loads-one-complete-ordered-membership-test
  (async done
         (let [page-uuid (random-uuid)
               child-uuids (vec (repeatedly 50 random-uuid))
               items (mapv (fn [index child-uuid]
                             [child-uuid (order-key index)])
                           (range)
                           child-uuids)
               block-loads (atom [])
               membership-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! block-loads conj [graph-id requested-uuid])
                              (p/resolved
                               (block-patch
                                1 {page-uuid (block page-uuid 1 "Large page")})))
                            subs/<load-children
                            (fn [graph-id requested-uuid]
                              (swap! membership-loads conj
                                     [graph-id requested-uuid])
                              (p/resolved
                               (children-patch 1 requested-uuid 1 items)))]
              (let [mounted (mount-normal-page! page-uuid)]
                (p/let [_ (p/delay 0)]
                  (is (= [[test-graph-id page-uuid]] @block-loads))
                  (is (= [[test-graph-id page-uuid]] @membership-loads)
                      "A complete direct membership uses one worker load.")
                  (is (= child-uuids
                         (:root-uuids @(:last-render mounted)))
                      "The root receives every direct UUID in worker order.")
                  (is (= 50
                         (count (:root-uuids @(:last-render mounted)))))
                  (dotimes [_ 3]
                    ((:scroll! mounted)))
                  (is (= 1 (count @block-loads)))
                  (is (= 1 (count @membership-loads))
                      "Scrolling and rerendering do not grow the membership window.")
                  (unmount! mounted))))))))

(deftest nested-membership-never-enters-page-root-data-test
  (async done
         (let [page-uuid (random-uuid)
               top-level-uuid (random-uuid)
               nested-uuid (random-uuid)
               membership-loads (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _requested-uuid]
                              (p/resolved
                               (block-patch
                                1 {page-uuid (block page-uuid 1 "Page")})))
                            subs/<load-children
                            (fn [_graph-id parent-uuid]
                              (swap! membership-loads conj parent-uuid)
                              (p/resolved
                               (children-patch
                                1 parent-uuid 1
                                (if (= page-uuid parent-uuid)
                                  [[top-level-uuid "a"]]
                                  [[nested-uuid "a"]]))))]
              (let [mounted (mount-normal-page! page-uuid)]
                (p/let [_ (p/delay 0)
                        unsubscribe-nested
                        (subs/subscribe-children! top-level-uuid (fn []))
                        _ (p/delay 0)]
                  (is (= [top-level-uuid]
                         (:root-uuids @(:last-render mounted))))
                  (is (= {:status :ready :value [nested-uuid]}
                         (subs/children-snapshot top-level-uuid)))
                  (is (not-any? #{nested-uuid}
                                (:root-uuids @(:last-render mounted)))
                      "Nested membership belongs only to its direct parent.")
                  (is (= [page-uuid top-level-uuid] @membership-loads))
                  (unsubscribe-nested)
                  (unmount! mounted))))))))

(deftest direct-membership-patches-insert-delete-reorder-and-move-test
  (async done
         (let [page-uuid (random-uuid)
               child-a (random-uuid)
               child-b (random-uuid)
               child-c (random-uuid)
               inserted (random-uuid)
               membership-loads (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _requested-uuid]
                              (p/resolved
                               (block-patch
                                1 {page-uuid (block page-uuid 1 "Page")})))
                            subs/<load-children
                            (fn [_graph-id requested-uuid]
                              (swap! membership-loads inc)
                              (p/resolved
                               (children-patch
                                1 requested-uuid 1
                                [[child-a "a"]
                                 [child-b "b"]
                                 [child-c "c"]])))]
              (let [mounted (mount-normal-page! page-uuid)
                    patch! (fn [rev remove-items upsert-items]
                             (subs/apply-delta!
                              (delta
                               rev
                               {:blocks
                                {page-uuid (block page-uuid rev "Page")}
                                :children
                                {page-uuid
                                 {:base-rev (dec rev)
                                  :rev rev
                                  :remove remove-items
                                  :upsert upsert-items}}})))]
                (p/let [_ (p/delay 0)
                        _ (is (= [child-a child-b child-c]
                                 (:root-uuids @(:last-render mounted))))
                        _ (patch! 2 [] [[inserted "bb"]])
                        _ (is (= [child-a child-b inserted child-c]
                                 (:root-uuids @(:last-render mounted)))
                              "Insert patches the direct vector in place.")
                        _ (patch! 3 [[child-b "b"]] [])
                        _ (is (= [child-a inserted child-c]
                                 (:root-uuids @(:last-render mounted)))
                              "Delete removes only the direct member.")
                        _ (patch! 4 [] [[child-c "0"]])
                        _ (is (= [child-c child-a inserted]
                                 (:root-uuids @(:last-render mounted)))
                              "Reorder replaces the child's order tuple.")
                        _ (patch! 5 [[child-a "a"]] [])
                        _ (is (= [child-c inserted]
                                 (:root-uuids @(:last-render mounted)))
                              "Moving out is a direct-parent removal.")
                        _ (patch! 6 [] [[child-a "z"]])]
                  (is (= [child-c inserted child-a]
                         (:root-uuids @(:last-render mounted)))
                      "Moving in is a direct-parent upsert.")
                  (is (= 1 @membership-loads)
                      "Valid incremental patches never refetch the list.")
                  (unmount! mounted))))))))
