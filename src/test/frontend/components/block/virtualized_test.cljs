(ns frontend.components.block.virtualized-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
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

(deftest subscribed-row-has-one-declarative-uuid-input-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        row-source (form-source source "(hsx/defc subscribed-block-row")]
    (is (some? row-source)
        "Block rendering exposes one small UUID-subscribed row.")
    (when row-source
      (is (= #{"db-hooks/use-block" "db-hooks/use-children"}
             (set (re-seq #"db-hooks/[a-z-]+" row-source)))
          "The row subscribes only to its canonical entity and direct membership.")
      (is (string/includes? row-source "block-uuid"))
      (is (string/includes? row-source "plain-block-list")
          "Recursive descendants go through the explicit plain list.")
      (testing "the subscribed row owns no graph-loading machinery"
        (doseq [forbidden ["db-async/"
                           "rfx/use-entity"
                           "use-effect"
                           "resident-tree"
                           "load-status"
                           "latest-transacted-entity-uuids"]]
          (is (not (string/includes? row-source forbidden))
              (str "Unexpected row concern: " forbidden)))))))

(deftest plain-block-list-renders-only-uuid-rows-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        list-source (form-source source "(hsx/defc plain-block-list")]
    (is (some? list-source)
        "Nested and non-page-root blocks share one plain list API.")
    (when list-source
      (is (string/includes? list-source "block-uuids"))
      (is (string/includes? list-source "subscribed-block-row"))
      (is (not (string/includes? list-source ":block/uuid"))
          "The list receives UUIDs instead of extracting UUIDs from entity maps."))))

(deftest loaded-block-row-rerenders-only-for-a-new-block-revision-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        comparator-source (form-source source "(defn- same-block-revision?")
        row-source (form-source source "(defn- render-loaded-block-row")
        container-source (form-source source "(hsx/defc block-container-inner")]
    (is (string/includes? comparator-source ":block/uuid"))
    (is (string/includes? comparator-source ":block/tx-id"))
    (is (not (string/includes? comparator-source "config")))
    (is (string/includes? row-source "memoized-loaded-block-row"))
    (is (not (string/includes? container-source
                               "memoized-block-container-inner-aux")))
    (is (= 1 (occurrence-count source "react-core/memo"))
        "Block rendering has one revision memo boundary.")))

(deftest cyclic-linked-page-keeps-a-real-virtuoso-row-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        row-source (form-source source "(hsx/defc linked-block-row")]
    (is (string/includes? row-source "loop-linked?"))
    (is (string/includes? row-source "render-loaded-block-row"))
    (is (not (string/includes? row-source
                               "(when-not (and loop-linked? (:block/name linked-block))")))))

(deftest nested-list-api-cannot-create-a-virtuoso-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        list-source (form-source source "(hsx/defc plain-block-list")]
    (is (some? list-source))
    (when list-source
      (is (zero? (occurrence-count list-source "ui/virtualized-list")))
      (is (not (string/includes? list-source "Virtuoso")))
      (is (not (string/includes? list-source ":block-children?"))
          "Nested rendering is a plain API, not a runtime virtualizer mode.")
      (is (not (string/includes? list-source "virtualized?"))))))

(deftest page-root-virtual-list-publishes-the-complete-uuid-vector-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        root-source (form-source source "(hsx/defc page-root-virtual-list")]
    (is (some? root-source)
        "A page root has one explicit virtualization owner.")
    (when root-source
      (is (= 1 (occurrence-count root-source "ui/virtualized-list")))
      (is (string/includes? root-source ":data (to-array block-uuids)")
          "Virtuoso receives the complete UUID vector atomically.")
      (is (string/includes? root-source
                            ":compute-item-key (fn [_idx block-uuid]"))
      (is (string/includes? root-source
                            ":item-content (fn [idx block-uuid]"))
      (is (string/includes? root-source ":items-rendered"))
      (is (not (string/includes? root-source ":range-changed")))
      (is (string/includes? root-source
                            "block-selection/virtual-range-boundary-id"))
      (is (not (string/includes? root-source
                                 ".addEventListener scroll-container \"scroll\""))
          "The virtualizer range must be the only scroll-selection source of truth.")
      (is (not (string/includes? root-source ":total-count"))
          "A separate row count cannot race the UUID data.")
      (testing "the root API never accepts or reconstructs entity rows"
        (doseq [forbidden [":block/uuid"
                           "(mapv :block/uuid"
                           ":block/children"
                           "resident-tree"
                           "load-status"]]
          (is (not (string/includes? root-source forbidden))
              (str "Unexpected page-root data: " forbidden)))))))

(deftest page-root-virtualizer-does-not-own-descendant-height-test
  (let [source (source-for "src/main/frontend/components/block.cljs")
        root-source (form-source source "(hsx/defc page-root-virtual-list")]
    (is (some? root-source))
    (when root-source
      (is (not (string/includes? root-source ":scrollSeekConfiguration"))
          "Replacing a mounted root row would collapse its plain descendants.")
      (is (not (string/includes? root-source ":ScrollSeekPlaceholder")))
      (is (not (string/includes? root-source
                                 ":skipAnimationFrameInResizeObserver true"))
          "A newly focused editor row may settle after the current layout."))))

(deftest scroll-position-persistence-runs-after-scrolling-stops
  (let [source (source-for "src/main/frontend/handler/common.cljs")
        listener-source (form-source source "(defn listen-to-scroll!")
        timeout-index (some-> listener-source
                              (string/index-of "js/setTimeout"))
        save-index (some-> listener-source
                           (string/index-of "state/save-scroll-position!"))]
    (is (some? listener-source))
    (is (and timeout-index save-index (> save-index timeout-index))
        "Persist the final scroll position instead of publishing during every scroll event.")))

(deftest ordinary-scroll-does-not-run-selection-work
  (let [source (source-for "src/main/frontend/components/block.cljs")
        selection-source
        (form-source source "(defn- select-block-under-pointer-after-scroll!")]
    (is (nil? selection-source)
        "Virtuoso range changes are the only virtualized scroll-selection path.")))

(deftest recursive-block-children-keep-the-left-border-dom
  (let [source (source-for "src/main/frontend/components/block.cljs")
        children-source (form-source source "(hsx/defc block-children\n")
        subscribed-source (form-source source "(hsx/defc subscribed-block-children")
        container-source
        (form-source
         source
         "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (some? children-source))
    (when children-source
      (is (string/includes? children-source
                            ":div.block-children-container.flex"))
      (is (string/includes? children-source
                            ":div.block-children-left-border"))
      (is (string/includes? children-source ":div.block-children.w-full")))
    (is (string/includes? subscribed-source "db-hooks/use-children"))
    (is (string/includes? subscribed-source "block-children"))
    (is (string/includes? container-source "subscribed-block-children"))))

(deftest block-control-owns-its-membership-subscription
  (let [source (source-for "src/main/frontend/components/block.cljs")
        control-source (form-source source "(hsx/defc subscribed-block-control")
        container-source
        (form-source
         source
         "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (string/includes? control-source "db-hooks/use-children"))
    (is (string/includes? control-source ":block.temp/has-children?"))
    (is (string/includes? control-source "block-control"))
    (is (string/includes? container-source "subscribed-block-control"))))

(deftest normal-block-collapse-uses-reactive-ui-state
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-source
        (form-source
         source
         "(hsx/defc ^:large-vars/cleanup-todo block-container-inner-aux")]
    (is (some? block-source))
    (when block-source
      (is (string/includes?
           block-source
           "(if (some? temp-collapsed?) temp-collapsed? db-collapsed?)")
          "Collapse and expand should update immediately while persistence completes."))))
