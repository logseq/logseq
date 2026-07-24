(ns frontend.components.page-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            ["react" :as react]
            [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "page-membership-test")

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

(deftest normal-page-loads-one-complete-ordered-10k-membership-test
  (async done
         (let [page-uuid (random-uuid)
               child-uuids (vec (repeatedly 10000 random-uuid))
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
                               {:basis-rev 1
                                :blocks
                                {page-uuid (block page-uuid 1 "Large page")}}))
                            subs/<load-children
                            (fn [graph-id requested-uuid]
                              (swap! membership-loads conj
                                     [graph-id requested-uuid])
                              (p/resolved {:basis-rev 1
                                           :parent-tx-id 1
                                           :items items}))]
              (let [mounted (mount-normal-page! page-uuid)]
                (p/let [_ (p/delay 0)]
                  (is (= [[test-graph-id page-uuid]] @block-loads))
                  (is (= [[test-graph-id page-uuid]] @membership-loads)
                      "A complete direct membership uses one worker load.")
                  (is (= child-uuids
                         (:root-uuids @(:last-render mounted)))
                      "The root receives every direct UUID in worker order.")
                  (is (= 10000
                         (count (:root-uuids @(:last-render mounted)))))
                  (dotimes [_ 100]
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
                               {:basis-rev 1
                                :blocks
                                {page-uuid (block page-uuid 1 "Page")}}))
                            subs/<load-children
                            (fn [_graph-id parent-uuid]
                              (swap! membership-loads conj parent-uuid)
                              (p/resolved
                               (if (= page-uuid parent-uuid)
                                 {:basis-rev 1
                                  :parent-tx-id 1
                                  :items [[top-level-uuid "a"]]}
                                 {:basis-rev 1
                                  :parent-tx-id 1
                                  :items [[nested-uuid "a"]]})))]
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
                               {:basis-rev 1
                                :blocks {page-uuid
                                         (block page-uuid 1 "Page")}}))
                            subs/<load-children
                            (fn [_graph-id _requested-uuid]
                              (swap! membership-loads inc)
                              (p/resolved
                               {:basis-rev 1
                                :parent-tx-id 1
                                :items [[child-a "a"]
                                        [child-b "b"]
                                        [child-c "c"]]}))]
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

(deftest page-rendering-exposes-explicit-normal-and-special-paths-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        normal-source (form-source source "(hsx/defc normal-page-root")
        special-source (form-source source "(hsx/defc special-page-root")]
    (is (some? normal-source))
    (when normal-source
      (is (= #{"db-hooks/use-block-projection" "db-hooks/use-children"}
             (set (re-seq #"db-hooks/[a-z-]+" normal-source))))
      (is (string/includes? normal-source "block/page-root-virtual-list"))
      (is (string/includes? normal-source ":div.page-blocks-inner.relative"))
      (doseq [forbidden [":block/children"
                         "db-async/"
                         "resident-block-tree"
                         "initial-tree-render-limit"
                         "use-entity-children-tx-id"]]
      (is (not (string/includes? normal-source forbidden)))))
    (is (some? special-source))
    (when special-source
      (is (string/includes? special-source "db-hooks/use-resource"))
      (is (string/includes? special-source
                            "page-membership-resource-key"))
      (is (string/includes? special-source
                            "block/page-root-virtual-list"))
      (is (string/includes? special-source ":div.page-blocks-inner.relative")))))

(deftest page-shell-ignores-render-timestamp-only-updates-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        projection-source (form-source source "(defn- render-stable-page")
        loaded-page-source (form-source source "(hsx/defc loaded-page")]
    (is (string/includes? projection-source
                          "(dissoc page :block/tx-id :block/updated-at)"))
    (is (string/includes? loaded-page-source
                          "db-hooks/use-block-projection page-uuid render-stable-page"))))

(deftest special-pages-use-one-explicit-membership-resource-key-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        resource-key-source
        (form-source source "(defn page-membership-resource-key")]
    (is (some? resource-key-source))
    (when resource-key-source
      (is (string/includes? resource-key-source ":normal nil"))
      (is (string/includes? resource-key-source
                            "[:page-membership page-uuid :class]"))
      (is (string/includes? resource-key-source
                            "[:page-membership page-uuid :property]"))
      (is (string/includes?
           resource-key-source
           "[:page-membership page-uuid :quick-add user-uuid]"))
      (is (string/includes? resource-key-source "(uuid? user-uuid)")
          "Quick-add membership keeps an explicit valid user scope."))))

(deftest linked-references-mount-without-render-readiness-gates-test
  (let [source (source-for "src/main/frontend/components/page.cljs")
        page-inner-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo page-inner")
        tabs-source (form-source source "(hsx/defc tabs")]
    (is (some? page-inner-source))
    (is (some? tabs-source))
    (when page-inner-source
      (is (string/includes? page-inner-source "reference/references"))
      (is (string/includes? page-inner-source
                            ":on-page-blocks-rendered (:on-page-blocks-rendered option)"))
      (doseq [forbidden ["linked-refs-blocks-ready"
                         "linked-refs-tagged-ready"
                         "linked-refs-ready?"
                         ":on-tagged-nodes-rendered"]]
        (is (not (string/includes? page-inner-source forbidden)))))
    (when tabs-source
      (is (string/includes? tabs-source "objects/class-objects"))
      (is (string/includes? tabs-source "objects/property-related-objects"))
      (is (not (string/includes? tabs-source "on-mounted")))
      (is (not (string/includes? tabs-source ":on-tagged-nodes-rendered"))))))

(deftest page-reference-and-preview-render-from-canonical-subscriptions-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        reference-source (form-source source "(hsx/defc page-reference")
        looked-up-reference-source
        (form-source source "(hsx/defc looked-up-page-reference")
        reference-content-source (form-source source "(defn- page-reference-content")
        subscribed-reference-source (form-source source "(hsx/defc subscribed-page-reference")
        preview-source (form-source source "(hsx/defc page-preview-trigger")
        preview-content-source (form-source source "(hsx/defc page-preview-content")]
    (is (some? reference-source))
    (is (some? reference-content-source))
    (is (some? subscribed-reference-source))
    (is (some? looked-up-reference-source))
    (is (some? preview-source))
    (is (some? preview-content-source))
    (when reference-source
      (is (string/includes? reference-source "referenced-block-uuid"))
      (is (not (string/includes? reference-source "db-hooks/use-resource")))
      (doseq [forbidden ["set-block!"
                         "db-async/<get-block"]]
        (is (not (string/includes? reference-source forbidden)))))
    (when looked-up-reference-source
      (is (string/includes? looked-up-reference-source
                            "db-hooks/use-resource [:page-identity uuid-or-title]")))
    (when subscribed-reference-source
      (is (= 1 (count (re-seq #"db-hooks/use-block"
                              subscribed-reference-source)))))
    (when reference-content-source
      (is (string/includes? reference-content-source "page-cp-inner"))
      (is (not (string/includes? reference-content-source
                                 "(page-cp config' (or block"))))
    (when preview-source
      (is (string/includes? preview-source ":page-preview-source"))
      (doseq [forbidden ["set-source!"
                         "db-async/<get-alias-source-page"
                         "db-async/<get-block-source"]]
        (is (not (string/includes? preview-source forbidden)))))
    (when preview-content-source
      (is (string/includes? preview-content-source "(page-cp "))
      (is (not (string/includes? preview-content-source
                                 "db-hooks/use-block"))))))

(deftest breadcrumb-mounts-from-a-uuid-resource-with-row-subscriptions-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        breadcrumb-source (form-source source "(hsx/defc breadcrumb\n")
        row-source (form-source source "(hsx/defc breadcrumb-segment-row")]
    (is (some? breadcrumb-source))
    (is (some? row-source))
    (when breadcrumb-source
      (is (string/includes? breadcrumb-source
                            "[:block-breadcrumb block-id load-depth]"))
      (is (string/includes? breadcrumb-source "db-hooks/use-resource"))
      (doseq [forbidden ["hooks/use-state"
                         "hooks/use-effect!"
                         "db-async/<get-block"
                         "db-async/<get-block-parents"
                         "<hydrate-breadcrumb-ref-titles!"]]
        (is (not (string/includes? breadcrumb-source forbidden)))))
    (when row-source
      (is (string/includes? row-source "db-hooks/use-block")))))

(deftest breadcrumb-overflow-mounts-one-full-depth-resource-child-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        dropdown-source (form-source source "(hsx/defc breadcrumb-overflow-dropdown")
        content-source (form-source source "(hsx/defc breadcrumb-overflow-content")]
    (is (some? dropdown-source))
    (is (some? content-source))
    (when dropdown-source
      (is (string/includes? dropdown-source "breadcrumb-overflow-content"))
      (doseq [forbidden ["full-hidden"
                         "load-full-hidden!"
                         "db-async/"
                         "<hydrate-breadcrumb-ref-titles!"]]
        (is (not (string/includes? dropdown-source forbidden)))))
    (when content-source
      (is (string/includes? content-source
                            "[:block-breadcrumb target-uuid 1000]"))
      (is (string/includes? content-source
                            "breadcrumb-model/build-breadcrumb-view"))
      (is (string/includes? content-source ":ancestor-uuids"))
      (is (string/includes? content-source ":ref-titles"))
      (is (string/includes? content-source "breadcrumb-dropdown-row")))
    (doseq [obsolete ["(defn- breadcrumb-segments"
                       "(defn- missing-breadcrumb-ref-ids"
                       "(defn- <hydrate-breadcrumb-ref-titles!"
                       "db-async/<get-block-parents"]]
      (is (not (string/includes? source obsolete))))))
