(ns frontend.components.block.virtualized-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.util :as util]))

(defn- repo-root
  []
  (.cwd js/process))

(defn- source-for
  [relative-file]
  (.toString (fs/readFileSync (node-path/join (repo-root) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (string/index-of source "\n(hsx/defc " (inc start))
                  (string/index-of source "\n(defn" (inc start))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest visible-row-cache-reuses-unchanged-rendered-values
  (let [cache* (atom nil)
        calls* (atom [])
        render! (fn [input]
                  (swap! calls* conj input)
                  #js {:input input})
        first-render (util/cached-render! cache* :page :a 1 = render!)
        second-render (util/cached-render! cache* :page :a 1 = render!)
        changed-render (util/cached-render! cache* :page :a 2 = render!)
        changed-context-render (util/cached-render! cache* :other-page :a 2 = render!)]
    (is (identical? first-render second-render))
    (is (not (identical? second-render changed-render)))
    (is (not (identical? changed-render changed-context-render)))
    (is (= [1 2 2] @calls*))))

(deftest visible-row-cache-evicts-items-outside-the-virtuoso-range
  (let [cache* (atom nil)
        calls* (atom [])
        render! (fn [input]
                  (swap! calls* conj input)
                  #js {:input input})]
    (util/cached-render! cache* :page :a :a = render!)
    (util/cached-render! cache* :page :b :b = render!)
    (util/retain-render-cache-keys! cache* #{:b})
    (util/cached-render! cache* :page :b :b = render!)
    (util/cached-render! cache* :page :a :a = render!)
    (is (= [:a :b :a] @calls*))))

(deftest unchanged-list-rows-reuse-their-rendered-elements
  (let [cache* (atom nil)
        calls* (atom [])
        render! (fn [input]
                  (swap! calls* conj (:id input))
                  #js {:id (:id input)})
        inputs [{:id :a :value 1}
                {:id :b :value 2}
                {:id :c :value 3}]
        first-render (util/reconcile-render-cache! cache* :page inputs :id = render!)
        second-render (util/reconcile-render-cache! cache* :page inputs :id = render!)]
    (is (= [:a :b :c] @calls*))
    (is (every? true? (map identical? first-render second-render)))))

(deftest render-cache-updates-only-changed-and-new-rows
  (let [cache* (atom nil)
            calls* (atom [])
            render! (fn [input]
                      (swap! calls* conj [(:id input) (:value input)])
                      #js {:id (:id input) :value (:value input)})]
        (util/reconcile-render-cache! cache*
                    :page
                    [{:id :a :value 1} {:id :b :value 2} {:id :c :value 3}]
                    :id
                    =
                    render!)
        (reset! calls* [])
        (util/reconcile-render-cache! cache*
                    :page
                    [{:id :a :value 1} {:id :d :value 4} {:id :b :value 20} {:id :c :value 3}]
                    :id
                    =
                    render!)
        (is (= [[:d 4] [:b 20]] @calls*))
        (reset! calls* [])
        (util/reconcile-render-cache! cache*
                    :page
                    [{:id :a :value 1} {:id :d :value 4} {:id :c :value 3}]
                    :id
                    =
                    render!)
        (util/reconcile-render-cache! cache*
                    :page
                    [{:id :a :value 1} {:id :d :value 4} {:id :b :value 20} {:id :c :value 3}]
                    :id
                    =
                    render!)
        (is (= [[:b 20]] @calls*)
            "A deleted row must leave the cache.")))

(deftest render-cache-invalidates-when-the-tree-context-changes
  (let [cache* (atom nil)
            calls* (atom [])
            render! (fn [input]
                      (swap! calls* conj (:id input))
                      #js {:id (:id input)})
            inputs [{:id :a :edge :top} {:id :b :edge :bottom}]]
        (util/reconcile-render-cache! cache* :page-a inputs :id = render!)
        (reset! calls* [])
        (util/reconcile-render-cache! cache* :page-b inputs :id = render!)
        (is (= [:a :b] @calls*))
        (reset! calls* [])
        (util/reconcile-render-cache! cache*
                    :page-b
                    [{:id :a :edge :top} {:id :b :edge :middle}]
                    :id
                    =
                    render!)
        (is (= [:b] @calls*)
            "Changing a row's top/bottom role must replace its rendered element.")))

(deftest complete-journal-trees-use-the-keyed-render-cache
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source "util/reconcile-render-cache!")
        "A non-virtualized complete tree must not recreate every unchanged React row.")
    (is (not (string/includes? block-list-source
                               "(map-indexed (fn [idx block]"))
        "The complete-tree path should reconcile cached keyed rows instead of remapping them.")))

(deftest fast-root-scroll-renders-lightweight-block-content
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")
        placeholder-source (form-source source "(defn- block-scroll-seek-placeholder")]
    (is (string/includes? block-list-source ":scrollSeekConfiguration")
        "The single root virtualizer should avoid mounting full blocks during fast scrolling.")
    (is (string/includes? block-list-source ":context #js {:blocks blocks}")
        "Passing a CLJS map would deep-convert every block on each tree delta.")
    (is (string/includes? block-list-source ":ScrollSeekPlaceholder block-scroll-seek-placeholder"))
    (is (some? placeholder-source))
    (when placeholder-source
      (is (string/includes? placeholder-source "(.-height props)")
          "The placeholder must preserve Virtuoso's measured row height.")
      (is (string/includes? placeholder-source "(:blocks context)")
          "The Virtuoso context may remain a ClojureScript map.")
      (is (string/includes? placeholder-source ":block/raw-title")
          "Fast scrolling should show block text instead of a blank skeleton.")
      (is (string/includes? placeholder-source ":block/title")
          "A structure payload without raw-title should still show its title.")
      (is (string/includes? placeholder-source "(gobj/get block \"raw-title\")")
          "Virtuoso converts context rows to plain objects with unqualified keys."))))

(deftest root-virtualizer-reuses-visible-row-elements-only
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source "util/cached-render!")
        "A tree delta should recreate only the changed visible row element.")
    (is (string/includes? block-list-source "util/retain-render-cache-keys!")
        "Rows leaving the Virtuoso range must be released from the element cache.")))

(deftest scroll-position-persistence-runs-after-scrolling-stops
  (let [source (source-for "src/main/frontend/handler/common.cljs")
        listener-source (form-source source "(defn listen-to-scroll!")
        timeout-index (string/index-of listener-source "js/setTimeout")
        save-index (string/index-of listener-source "state/save-scroll-position!")]
    (is (some? listener-source))
    (is (and timeout-index save-index (> save-index timeout-index))
        "Persist the final scroll position instead of publishing state during every scroll event.")))

(deftest ordinary-scroll-does-not-run-selection-work
  (let [source (source-for "src/main/frontend/components/block.cljs")
        selection-source (form-source source "(defn- select-block-under-pointer-after-scroll!")]
    (is (some? selection-source))
    (is (string/includes? selection-source "block-selection/pointer-down?")
        "Only pointer selection should update selection while scrolling.")))

(deftest unchanged-blocks-skip-deep-render-comparison
  (let [source (source-for "src/main/frontend/components/block.cljs")
        changed-source (form-source source "(defn- block-changed?")]
    (is (some? changed-source))
    (is (string/includes? changed-source "(identical? old-block new-block)")
        "Virtuoso should not rebuild render-state values for the same immutable block.")))

(deftest block-refresh-subscribes-to-its-own-transaction
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? block-container-source))
    (is (string/includes? block-container-source "(rfx/use-entity-tx-id block)")
        "A block should only react to transactions that affect that block.")
    (is (not (string/includes? block-container-source
                               "(rfx/use-sub [:db/latest-transacted-entity-uuids])"))
        "A transaction must not re-render every visible block.")))

(deftest page-index-nodes-hydrate-only-their-own-render-payload
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? block-container-source))
    (is (string/includes? block-container-source ":block-tree/index?"))
    (is (string/includes? block-container-source "index-node?"))
    (is (string/includes? block-container-source ":children? (and load-children? (not index-node?))")
        "A visible structure-only node may hydrate itself but must not request its children again.")
    (is (string/includes? block-container-source ":block/children (:block/children block*)")
        "Hydrating a node must retain the complete structural children already returned with the page index.")))

(deftest page-trees-use-the-existing-bounded-virtuoso-path
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (some? block-list-source))
    (is (not (string/includes? block-list-source ":virtual/tree-prefix?"))
        "Tree pages must release rows through Virtuoso instead of disabling virtualization.")))

(deftest journal-items-own-their-single-root-virtualizer
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (not (string/includes? block-list-source "(:journals? config)"))
        "The journal ID stream is lightweight; a mounted journal virtualizes its root blocks once.")))

(deftest block-children-never-nest-a-second-virtualizer
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source
                          "disable-virtualized? (or (util/rtc-test?)\n                                 (:block-children? config)")
        "Only the page or journal root may own virtualization.")
    (is (string/includes? block-list-source
                          "virtualized? (and virtualization-enabled?\n                          (not disable-virtualized?)")
        "A mounted list must turn virtualization off if it becomes a child list.")))

(deftest supplied-selection-ids-do-not-remap-every-virtual-row-id
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (not (string/includes? block-list-source "virtualized-block-ids"))
        "A wide page already supplies selection IDs; rendering must not map the whole list again.")))

(deftest recursive-block-children-keep-the-left-border-dom
  (let [source (source-for "src/main/frontend/components/block.cljs")
        children-source (form-source source "(hsx/defc block-children\n")]
    (is (some? children-source))
    (is (string/includes? children-source ":div.block-children-container.flex"))
    (is (string/includes? children-source ":div.block-children-left-border"))
    (is (string/includes? children-source ":div.block-children.w-full"))))

(deftest render-config-comparison-does-not-allocate-maps
  (let [source (source-for "src/main/frontend/components/block.cljs")
        comparator-source (form-source source "(defn- same-block-render-input?")]
    (is (some? comparator-source))
    (is (string/includes? comparator-source "every?")
        "Memo comparison should compare relevant keys without select-keys allocations.")))

(deftest empty-positioned-property-payload-does-not-refetch
  (let [source (source-for "src/main/frontend/components/block.cljs")
        properties-source (form-source source "(hsx/defc block-positioned-properties")]
    (is (some? properties-source))
    (is (string/includes? properties-source
                          "(contains? block :block.temp/positioned-properties)")
        "An explicit empty positioned-properties map is a complete worker payload.")
    (is (not (string/includes? properties-source
                               "(set-positioned-properties! payload-positioned-properties)"))
        "A complete worker payload should render directly without syncing through local state.")))

(deftest default-display-properties-payload-does-not-refetch
  (let [source (source-for "src/main/frontend/components/property.cljs")
        display-source (form-source source "(defn- use-display-properties")]
    (is (some? display-source))
    (is (string/includes? display-source ":block.temp/display-properties"))
    (is (string/includes? display-source "display-properties-payload?")
        "Default page rows should use display properties from the window payload.")
    (is (string/includes? display-source "rfx/use-entity-tx-id")
        "Display properties should only react to their block's transaction.")
    (is (not (string/includes? display-source
                               "(rfx/use-sub [:db/latest-transacted-entity-uuids])"))
        "Display properties must not re-render on unrelated block transactions.")))

(deftest sync-conflict-payload-does-not-refetch
  (let [source (source-for "src/main/frontend/components/block.cljs")
        conflict-source (form-source source "(hsx/defc sync-conflicts-warning-button")]
    (is (some? conflict-source))
    (is (string/includes? conflict-source ":block.temp/sync-conflicts"))
    (is (string/includes? conflict-source "sync-conflicts-payload?")
        "Virtual rows should use the conflict snapshot from their page window.")))

(deftest task-spent-time-payload-does-not-refetch
  (let [source (source-for "src/main/frontend/components/block.cljs")
        task-source (form-source source "(hsx/defc task-spent-time-cp")]
    (is (some? task-source))
    (is (string/includes? task-source ":block.temp/task-spent-time"))
    (is (string/includes? task-source "task-spent-time-payload?")
        "Journal metadata batches should prevent one spent-time request per task block.")))

(deftest incomplete-property-blocks-wait-for-their-existing-batched-hydration
  (let [source (source-for "src/main/frontend/components/block.cljs")
        container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? container-source))
    (is (string/includes? container-source ":block-metadata? true")
        "The existing block fetch should include metadata instead of starting parallel requests.")
    (is (string/includes? container-source "metadata-payload-ready?")
        "Metadata effects must stay disabled until the batched block payload arrives.")))

(deftest comment-presence-payload-does-not-refetch
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (some? block-source))
    (is (string/includes? block-source ":block.temp/comment-thread-present?"))
    (is (string/includes? block-source "comment-thread-presence-payload?")
        "Virtual rows should not schedule a second comment-presence query.")))

(deftest empty-render-payload-skips-empty-components
  (let [source (source-for "src/main/frontend/components/block.cljs")]
    (is (string/includes? source "render-block-positioned-properties?"))
    (is (string/includes? source "render-block-reactions?")
        "Complete empty payloads should not mount components that render nothing.")))

(deftest block-reactions-do-not-refetch-the-current-user
  (let [source (source-for "src/main/frontend/components/block.cljs")
        reactions-source (form-source source "(hsx/defc block-reactions")]
    (is (some? reactions-source))
    (is (string/includes? reactions-source "user-handler/user-uuid"))
    (is (not (string/includes? reactions-source "db-async/<get-block"))
        "Every reaction block should reuse the authenticated user UUID from its payload.")))

(deftest block-reactions-wait-for-batched-metadata-hydration
  (let [source (source-for "src/main/frontend/components/block.cljs")
        predicate-source (form-source source "(defn- render-block-reactions?")
        outline-source (form-source source "(defn- block-renderer-outline-view")]
    (is (some? predicate-source))
    (is (string/includes? predicate-source "block-metadata-ready?")
        "Incomplete virtual rows must not start one reaction query per block while hydration is pending.")
    (is (string/includes? outline-source "(render-block-reactions? config block)"))))

(deftest normal-block-collapse-uses-reactive-ui-state
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (string/includes? block-source
                          "(if (some? temp-collapsed?) temp-collapsed? db-collapsed?)")
        "Collapse and expand should update immediately while the worker transaction persists.")))
