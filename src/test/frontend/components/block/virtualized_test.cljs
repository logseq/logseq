(ns frontend.components.block.virtualized-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.common.page-window :as page-window]))

(deftest structural-refresh-keeps-the-visible-window-anchor
  (is (= {:anchor :bottom}
         (page-window/refresh-opts {:offset 40
                                    :rows (vec (repeat 60 {}))
                                    :total-count 100})))
  (is (= {:offset 10}
         (page-window/refresh-opts {:offset 10
                                    :rows (vec (repeat 60 {}))
                                    :total-count 100})))
  (is (= {:offset 0}
         (page-window/refresh-opts nil))))

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

(deftest block-list-virtualized-height-is-owned-by-virtuoso
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")]
    (is (some? block-list-source)
        "block-list component should exist")
    (testing "Virtuoso measures resize changes synchronously for editable block lists"
      (is (string/includes? block-list-source ":skipAnimationFrameInResizeObserver true")))
    (testing "blocks-list-wrap must not mirror Virtuoso internal height"
      (is (not (re-find #"(?s)ResizeObserver[\s\S]*\.-height\s+\(\.-style" block-list-source))
          "Do not copy the internal Virtuoso height to the outer blocks-list-wrap; it can compound stale measurements after Enter splits multiline blocks"))
    (testing "paginated flat windows are owned by Virtuoso indexes"
      (is (string/includes? block-list-source ":virtual/total-count"))
      (is (string/includes? block-list-source ":virtual/on-range-changed"))
      (is (string/includes? block-list-source ":context virtual-context")
          "Virtuoso should rerender visible items when a worker page window changes.")
      (is (string/includes? block-list-source "(gobj/get context \"renderItem\")")
          "Virtual items must render from the current Virtuoso context, not a stale callback closure.")
      (is (not (string/includes? block-list-source "(gobj/get context \"itemKey\")"))
          "Item keys must remain stable while rapid structural edits update the render context.")
      (is (= 2
             (count (re-seq #"\(str \(:container-id config\) \"-\" \(:block/uuid block\)\)"
                            block-list-source)))
          "Virtualized and regular rows must use graph-stable block UUID keys.")
      (is (string/includes? block-list-source ":hide-children? true"))
      (is (string/includes? block-list-source ":block/level"))
      (is (string/includes? block-list-source "-placeholder-")))
    (testing "unloaded virtual rows return a React element"
      (is (string/includes? block-list-source
                            "(react-core/createElement \"div\" #js {:style #js {:height 29}})")))))

(deftest flat-row-selection-highlight-keeps-parent-width
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-list-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-list")
        block-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")
        render-config-source (form-source source "(def ^:private block-render-config-keys")]
    (is (some? block-list-source))
    (is (some? block-source))
    (is (some? render-config-source))
    (testing "flat rows indent their content inside the selectable block"
      (is (string/includes? block-list-source ":virtual/indent"))
      (is (string/includes? block-source ":padding-left (:virtual/indent config)"))
      (is (string/includes? render-config-source ":virtual/indent")
          "Moving a block between levels must update its rendered indent.")
      (is (not (string/includes? block-list-source
                                 ":paddingLeft (* 29"))
          "Indent outside .ls-block makes a child selection narrower than its parent."))))

(deftest flat-virtualized-rows-do-not-load-children-per-row
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? block-container-source)
        "block-container component should exist")
    (is (string/includes? block-container-source "(not (:hide-children? config))")
        "Flat virtualized row config should be part of the single load-children? decision.")
    (is (string/includes? block-container-source ":children? load-children?")
        "Flat virtualized rows should not issue row-level child hydration; expansion is owned by page-window refresh.")
    (is (string/includes? block-container-source
                          "(when-not complete-flat-row?")
        "A complete flat virtual row should not re-fetch itself on mount.")))

(deftest linked-block-does-not-inherit-host-flat-list-layout
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-item-source (form-source source "(hsx/defc block-item-inner")]
    (is (some? block-item-source))
    (is (string/includes? block-item-source ":virtual/flat-list?")
        "A linked block must clear host flat-list layout before rendering its own tree.")))

(deftest complete-flat-row-renders-new-props-without-a-stale-frame
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? block-container-source))
    (is (string/includes? block-container-source "complete-flat-row?")
        "Complete worker rows should have one explicit render path.")
    (is (string/includes? block-container-source
                          "(if complete-flat-row? block* local-block)")
        "A new virtual-row prop must render in the same commit instead of waiting for an effect.")))

(deftest page-window-offset-moves-in-stable-steps
  (let [source (source-for "src/main/frontend/components/page.cljs")
        offset-source (form-source source "(defn- range->page-block-window-offset")]
    (is (some? offset-source))
    (is (string/includes? source
                          "(def ^:private page-block-window-limit common-page-window/limit)")
        "The worker window should cover the rendered range, not hydrate 150 rows per scroll update.")
    (is (string/includes? source "page-block-window-step"))
    (is (string/includes? offset-source "page-window"))
    (is (string/includes? offset-source "loaded-end"))))

(deftest page-window-loader-coalesces-range-changes-while-loading
  (let [source (source-for "src/main/frontend/components/page.cljs")
        loader-source (form-source source "(defn- page-window-loader")]
    (is (some? loader-source))
    (is (string/includes? loader-source "*next-request")
        "Virtuoso range changes should retain only the latest request while one worker request is running.")
    (is (string/includes? loader-source "(when-not (= opts current-request) opts)")
        "The pending request should be only the latest range that differs from the active request.")
    (is (string/includes? loader-source "(nil? @*next-request)")
        "An obsolete worker response should not publish an intermediate render window.")
    (is (string/includes? loader-source "p/finally")
        "The latest queued window should start after the active request settles.")))

(deftest page-window-row-overrides-use-block-uuids
  (let [source (source-for "src/main/frontend/components/page.cljs")
        overrides-start (string/index-of source "(defn- block-row-overrides")
        overrides-end (string/index-of source "(defn- refresh-row-overrides!" overrides-start)
        overrides-source (subs source overrides-start overrides-end)
        merge-source (form-source source "(defn- merge-updated-page-window-row")]
    (is (some? overrides-source))
    (is (some? merge-source))
    (is (string/includes? overrides-source ":block/uuid"))
    (is (not (string/includes? overrides-source ":db/id"))
        "Datascript entity ids repeat across graphs and cannot identify UI rows.")
    (is (not (string/includes? merge-source "blocks-by-id"))
        "Row overrides must have one identity path.")))

(deftest virtualized-insert-leaves-sibling-order-to-worker
  (let [block-source (source-for "src/main/frontend/components/block.cljs")
        editor-source (source-for "src/main/frontend/handler/editor.cljs")
        outliner-source (source-for "deps/outliner/src/logseq/outliner/core.cljs")]
    (is (not (string/includes? block-source ":outliner/right-order-state")))
    (is (not (string/includes? block-source ":outliner/child-order-state")))
    (is (not (string/includes? editor-source ":end-order-state")))
    (is (not (string/includes? outliner-source "end-order-state"))
        "Insert order must come from the worker transaction DB.")))

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
