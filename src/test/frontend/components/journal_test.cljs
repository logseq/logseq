(ns frontend.components.journal-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.journal-state :as journal-state]))

(defn- journal-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process) "src/main/frontend/components/journal.cljs")
    "utf8")))

(defn- page-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process) "src/main/frontend/components/page.cljs")
    "utf8")))

(defn- block-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process) "src/main/frontend/components/block.cljs")
    "utf8")))

(defn- property-source
  []
  (.toString
   (fs/readFileSync
    (node-path/join (.cwd js/process) "src/main/frontend/components/property.cljs")
    "utf8")))

(deftest journals-do-not-hydrate-every-page-before-rendering
  (let [source (journal-source)]
    (is (not (string/includes? source "p/all (map #(db-async/<get-block"))
        "The journal list must not hydrate every journal in a separate fan-out.")
    (is (string/includes? source "db-async/<get-latest-journals")
        "The journal index should reuse the existing worker summary API.")
    (is (string/includes? source ":query-fn (fn [_ _]")
        "Reactive query functions receive the previous result and transaction context.")
    (is (not (string/includes? source "views/<load-view-data"))
        "Journals should not route through the generic view API.")))

(deftest unloaded-journal-slots-render-their-indexed-date-title
  (let [source (journal-source)]
    (is (string/includes? source ":block/keys [journal-day]")
        "The lightweight index must provide enough data to render a real title.")
    (is (string/includes? source "journal-slot-placeholder"))
    (is (string/includes? source ":div.ls-page-title-container.block-content.inline")
        "The placeholder must use the exact page-title typography contract.")
    (is (string/includes? source "(when-not loaded?"))
    (is (string/includes? source "date-time-util/int->journal-title")
        "The placeholder title must use the graph's journal date formatter.")))

(deftest visible-journals-render-a-complete-base-tree-before-secondary-data
  (let [source (page-source)]
    (is (string/includes? source "db-async/<get-block-with-children")
        "A visible journal should request its root and blocks together.")
    (is (string/includes? source ":all? true")
        "The logical journal tree must not have a block count cap.")
    (is (string/includes? source ":render-data? false")
        "Expensive derived properties must not block the first visible journal content.")
    (is (string/includes? source ":block-metadata? true")
        "The base tree must carry cheap metadata markers that prevent per-block requests.")))

(deftest journal-secondary-data-reuses-the-existing-block-batcher
  (let [source (page-source)]
    (is (string/includes? source "db-async/<get-blocks")
        "Missing derived properties should be hydrated through the existing block batcher.")
    (is (string/includes? source ":render-data? true")
        "The settled batch should contain derived render properties.")
    (is (string/includes? source "outliner-tree/reconcile-block-tree")
        "The batch should be merged into the existing outliner tree instead of rebuilding a flat UI list.")))

(deftest journal-secondary-data-is-merged-before-metadata-effects-render
  (let [source (page-source)]
    (is (string/includes? source "root (hooks/use-memo")
        "The render tree should be derived during render, not in a later effect.")
    (is (string/includes? source "(if (some? render-blocks)")
        "A settled metadata batch must participate in the current render.")
    (is (string/includes? source
                          "(outliner-tree/reconcile-block-tree root-from-tx render-blocks #{})")
        "The block tree must already contain the batch when metadata-ready components render.")))

(deftest journal-page-reuses-bundled-root-reference-count
  (let [source (page-source)]
    (is (string/includes? source "(contains? page-block :block.temp/refs-count)")
        "A complete journal payload should not wait for another root reference-count request.")))

(deftest non-plain-base-tree-blocks-hydrate-positioned-properties-on-demand
  (let [source (block-source)]
    (is (string/includes? source "positioned-properties-payload?")
        "Blocks with a render payload should not request positioned properties again.")
    (is (string/includes? source "db-async/<get-block repo")
        "Non-plain blocks should reuse the existing block batcher on demand.")
    (is (string/includes? source ":render-data? true")
        "The on-demand request must include positioned render data.")))

(deftest journal-property-blocks-reuse-renderable-loaded-tree-nodes
  (let [page (page-source)
        block (block-source)
        property-value (.toString
                        (fs/readFileSync
                         (node-path/join (.cwd js/process)
                                         "src/main/frontend/components/property/value.cljs")
                         "utf8"))]
    (is (string/includes? page ":block-tree/root*")
        "A mounted page must expose its current loaded tree without copying it.")
    (is (string/includes? property-value ":block-tree/root*")
        "Property block containers must retain access to the page tree.")
    (is (string/includes? block "tree/loaded-node")
        "A property block already present in the page tree must be reused by ID.")
    (is (string/includes? block
                          "not= :index (:block.temp/load-status loaded-tree-block)")
        "Only lightweight index nodes require worker hydration.")))

(deftest old-journal-metadata-waits-until-scroll-settles
  (let [journal (journal-source)
        block (block-source)
        property (property-source)]
    (is (string/includes? journal "journal-metadata-hydration-delay-ms")
        "Secondary metadata should wait until journal scrolling settles.")
    (is (string/includes? journal ":block-metadata-ready? metadata-ready?")
        "Each mounted journal should publish its metadata readiness to the block tree.")
    (is (string/includes? block ":block-metadata-ready?")
        "Block metadata requests should honor journal readiness.")
    (is (string/includes? property ":block-metadata-ready?")
        "Property metadata requests should honor journal readiness.")))

(deftest journal-block-trees-never-start-per-block-metadata-effects
  (let [page (page-source)
        property (property-source)]
    (is (string/includes? page ":block-metadata-ready? false")
        "Journal block trees must only consume the page-level metadata batch.")
    (is (string/includes? property
                          "(contains? block :block.temp/display-properties)")
        "A completed payload must render even while per-block requests stay disabled.")))

(deftest two-most-recent-journal-trees-are-pinned-without-pinning-their-dom
  (let [source (journal-source)]
    (is (string/includes? source "(< idx 2)")
        "The two most recent journals should keep their logical trees resident.")
    (is (string/includes? source ":keep-tree-resident?")
        "Resident logical trees must not pin their DOM nodes.")
    (is (string/includes? source ":on-page-blocks-rendered")
        "Recent journals must finish loading before an offscreen slot releases its DOM.")))

(deftest page-block-ready-callback-reaches-the-journal-slot
  (let [source (page-source)]
    (is (string/includes? source "outer-blocks-rendered")
        "Page-local readiness must not replace the caller's readiness callback.")
    (is (string/includes? source "(when outer-blocks-rendered")
        "Pages without an outer readiness callback must remain valid.")
    (is (string/includes? source "(outer-blocks-rendered)")
        "A loaded journal must notify its slot so offscreen DOM can be released.")))

(deftest visible-journal-slot-mounts-immediately
  (is (true? (journal-state/slot-load-now? true false))
      "A journal inside the real viewport must start loading without an artificial delay."))

(deftest journal-prefetch-slots-still-wait-for-scroll-to-settle
  (let [source (journal-source)]
    (is (string/includes? source "journal-slot-visible?")
        "The observer must distinguish the real viewport from its preload margin.")
    (is (string/includes? source "visible?\n                                 (mount-slot!)")
        "A visible journal must mount immediately.")
    (is (string/includes? source "intersecting?\n                                 (schedule-mount!)")
        "A journal seen only by the preload margin should retain the settled-scroll delay.")))

(deftest journal-slot-releases-an-offscreen-in-flight-tree
  (is (false? (journal-state/slot-load-now? false false))
      "An offscreen request must not commit its complete tree into the DOM."))

(deftest journal-slot-keeps-focused-and-settled-visible-content-mounted
  (is (true? (journal-state/slot-load-now? false true))
      "Focused journal content must remain stable outside the preload window.")
  (is (true? (journal-state/slot-load-now? true false))
      "A journal in the real viewport must load immediately.")
  (is (false? (journal-state/slot-load-now? false false))
      "Loaded offscreen DOM must be released while its measured placeholder remains."))

(deftest journal-stream-never-nests-virtualizers
  (let [journal-component-source (journal-source)
        block-component-source (block-source)]
    (is (not (string/includes? journal-component-source "ui/virtualized-list"))
        "Journal slots must not wrap journal block virtualizers in another virtualizer.")
    (is (string/includes? journal-component-source "js/IntersectionObserver.")
        "One viewport observer should mount and release journal slots on demand.")
    (is (not (string/includes? block-component-source "(:journals? config)"))
        "A mounted journal owns the one root block virtualizer.")
    (is (string/includes? block-component-source "(:block-children? config)")
        "Recursive block children must never create another virtualizer.")))

(deftest journal-slots-preserve-height-while-their-dom-is-released
  (let [source (journal-source)]
    (is (string/includes? source "journal-item-height-by-key*")
        "Measured journal heights must survive DOM release.")
    (is (string/includes? source ":min-height placeholder-height"))
    (is (string/includes? source ":rootMargin \"400px 0px\"")
        "Only journals close to the viewport should request their complete trees.")
    (is (string/includes? source "margin 400")
        "Focus release and viewport loading should use the same bounded window.")
    (is (string/includes? source "(map-indexed")
        "The UI should retain a lightweight ordered slot for every journal ID.")))

(deftest mounted-journal-slot-keeps-the-master-dom-shape
  (let [source (journal-source)
        item-index (string/index-of source ":div.journal-item.content")
        page-index (string/index-of source "(page/page-cp")]
    (is (some? item-index))
    (is (and page-index (< item-index page-index))
        "The mounted DOM must remain journal item -> page -> outliner tree.")))
