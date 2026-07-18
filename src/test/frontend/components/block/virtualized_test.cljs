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

(deftest journal-items-do-not-nest-a-second-virtualizer
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (string/includes? block-list-source "(:journals? config)")
        "The journal stream owns virtualization; each mounted journal renders one complete tree.")))

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

(deftest normal-block-collapse-uses-reactive-ui-state
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (string/includes? block-source
                          "(if (some? temp-collapsed?) temp-collapsed? db-collapsed?)")
        "Collapse and expand should update immediately while the worker transaction persists.")))
