(ns frontend.components.block.virtualized-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]))

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

(deftest block-list-uses-react-and-virtuoso-lifecycles-only
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (not (string/includes? block-list-source "util/cached-render!")))
    (is (not (string/includes? block-list-source "util/reconcile-render-cache!")))
    (is (not (string/includes? block-list-source "util/retain-render-cache-keys!")))
    (is (not (string/includes? block-list-source ":rangeChanged"))
        "Virtuoso alone should own virtual row mounting, release, and measured height state.")
    (is (string/includes? block-list-source "(map-indexed (fn [idx block]")
        "React should reconcile nonvirtual rows by their stable keys.")))

(deftest fast-root-scroll-keeps-tree-row-height-stable
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")
        placeholder-source (form-source source "(defn- block-scroll-seek-placeholder")]
    (is (not (string/includes? block-list-source ":scrollSeekConfiguration"))
        "A tree row can contain descendants outside Virtuoso's measured root height; replacing it while scrolling collapses the page.")
    (is (not (string/includes? block-list-source ":ScrollSeekPlaceholder")))
    (is (nil? placeholder-source)
        "Root tree rows must stay mounted so their descendant height remains stable.")))

(deftest root-virtualizer-publishes-row-data-atomically
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source ":data (to-array blocks)")
        "Virtuoso must receive the rows in the same update as their count without converting block maps.")
    (is (not (string/includes? block-list-source ":total-count blocks-count"))
        "A separate totalCount can expose an index before its row data is current.")
    (is (string/includes? block-list-source ":compute-item-key (fn [_idx block]")
        "A row key must come from the row supplied by Virtuoso, not an index closure.")
    (is (string/includes? block-list-source ":item-content (fn [idx block]")
        "New rows must render from Virtuoso's atomic data payload.")))

(deftest root-virtualizer-measures-new-editor-rows-after-layout
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (not (string/includes? block-list-source
                               ":skipAnimationFrameInResizeObserver true"))
        "A newly focused editor row can be transiently zero-sized until the next animation frame.")))

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

(deftest changed-descendant-does-not-invalidate-ancestor-render
  (let [source (source-for "src/main/frontend/components/block.cljs")
        same-input-source (subs source
                                (string/index-of source "(defn- same-block-list-item-input?")
                                (string/index-of source "(defn- same-loaded-block-input?"))]
    (is (string/includes? same-input-source "(:block/uuid old-block)")
        "A list item should retain the mounted component for the same block identity.")
    (is (not (string/includes? same-input-source ":block/tx-id"))
        "Content changes are owned by the block's entity subscription, not repeated through list props.")
    (is (not (string/includes? same-input-source ":block/children"))
        "Children have their own direct-parent subscription and must not re-render ancestor rows.")))

(deftest inserting-after-the-last-child-reuses-the-current-row
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source
                          "boundary-roles? (not (:block-children? config))")
        "Nested child rows do not consume root-list boundary roles.")
    (is (string/includes? block-list-source
                          "top? (and boundary-roles? (zero? idx))"))
    (is (string/includes? block-list-source
                          "bottom? (and boundary-roles? (= (dec blocks-count) idx))")
        "Appending a child must not recreate the former last row just because it stopped being last.")))

(deftest loaded-block-content-still-reacts-to-its-entity-revision
  (let [source (source-for "src/main/frontend/components/block.cljs")
        comparator-source (form-source source "(defn- same-loaded-block-input?")
        loaded-container-source (subs source
                                      (string/index-of source "(def loaded-block-container")
                                      (string/index-of source "(hsx/defc block-container"))]
    (is (string/includes? comparator-source ":block/tx-id")
        "Persisted title and property changes must pass through the content memo.")
    (is (string/includes? loaded-container-source "same-loaded-block-input?")
        "The content component must not use the structure-only list-item comparator.")))

(deftest children-subscribe-only-to-their-direct-parent
  (let [source (source-for "src/main/frontend/components/block.cljs")
        children-source (form-source source "(hsx/defc block-children\n")]
    (is (string/includes? children-source "rfx/use-entity-children-tx-id")
        "Only the mounted child list should react to a structural parent change.")
    (is (string/includes? children-source "resident-tree-node")
        "The child list should read the already-reconciled resident tree.")))

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

(deftest hydrated-tree-nodes-always-use-authoritative-children
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (string/includes? block-container-source
                          "(assoc local-block :block/children (:block/children block*))")
        "A hydrated local payload must not keep a stale descendant tree when direct child UUIDs are unchanged.")))

(deftest worker-self-payload-renders-without-a-second-fetch
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (string/includes? block-container-source
                          "(not= :index (:block.temp/load-status loaded-tree-block))")
        "A worker response already contains renderable :self data and must commit with the editor transition.")
    (is (not (string/includes? block-container-source
                               "(= :full (:block.temp/load-status loaded-tree-block))"))
        "Only index placeholders require a follow-up hydration request.")))

(deftest unloaded-page-index-row-keeps-a-measurable-height
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (string/includes? block-container-source "unloaded-block-placeholder")
        "An unloaded page-tree index row must not return nil inside Virtuoso.")))

(deftest page-tree-hydrates-in-steps-of-25
  (let [page-source (source-for "src/main/frontend/components/page.cljs")
        async-source (source-for "src/main/frontend/db/async.cljs")]
    (is (string/includes? page-source
                          "(def ^:private initial-tree-render-limit 25)"))
    (is (string/includes? async-source
                          "(def ^:private get-blocks-batch-limit 25)")
        "Index rows mounted by one virtual window should share batches of 25.")))

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
        comparator-source (form-source source "(defn- same-block-list-item-input?")]
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
        display-source (form-source source "(defn- use-display-properties")
        payload-source (form-source source "(defn- bundled-display-properties")]
    (is (some? display-source))
    (is (string/includes? payload-source ":block.temp/display-properties"))
    (is (string/includes? display-source "bundled-display-properties"))
    (is (string/includes? display-source "display-properties-payload?")
        "Default page rows should use display properties from the window payload.")
    (is (string/includes? display-source "rfx/use-entity-tx-id")
        "Display properties should only react to their block's transaction.")
    (is (not (string/includes? display-source
                               "(rfx/use-sub [:db/latest-transacted-entity-uuids])"))
        "Display properties must not re-render on unrelated block transactions.")))

(deftest supplied-page-entities-refresh-only-when-needed
  (let [source (source-for "src/main/frontend/components/block.cljs")
        refresh-source (form-source source "(defn- page-entity-refresh?")
        page-source (form-source source "(hsx/defc page-cp-inner")]
    (is (some? refresh-source))
    (when refresh-source
      (is (string/includes? refresh-source "(nil? page-entity)")
          "A missing page entity still needs hydration.")
      (is (string/includes? refresh-source "(not= previous-tx-id latest-tx-id)")
          "A worker transaction affecting the page must refresh icon and property data.")
      (is (string/includes? refresh-source ":skip-async-load?"))
      (is (string/includes? refresh-source ":table-view?")))
    (is (string/includes? page-source "page-entity-refresh?")
        "A complete referenced page must render without a duplicate initial request.")))

(deftest bundled-journal-root-properties-do-not-refetch
  (let [source (source-for "src/main/frontend/components/property.cljs")
        display-source (form-source source "(defn- use-display-properties")
        bidirectional-source (form-source source "(hsx/defc load-bidirectional-properties")]
    (is (string/includes? display-source "bundled-display-properties"))
    (is (string/includes? bidirectional-source "bundled-bidirectional-properties"))
    (is (string/includes? bidirectional-source "db-async/<get-bidirectional-properties")
        "Missing or stale contexts must retain the existing request path.")))

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
