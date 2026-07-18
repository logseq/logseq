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

(deftest journals-do-not-hydrate-every-page-before-rendering
  (let [source (journal-source)]
    (is (not (string/includes? source "p/all (map #(db-async/<get-block"))
        "The journal list must not hydrate every journal in a separate fan-out.")))

(deftest visible-journals-request-one-complete-renderable-tree
  (let [source (page-source)]
    (is (string/includes? source "db-async/<get-block-with-children")
        "A visible journal should request its root and blocks together.")
    (is (string/includes? source ":all? true")
        "The logical journal tree must not have a block count cap.")
    (is (not (string/includes? source ":render-data? false"))
        "The journal request must not return structure-only child payloads.")))

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

(deftest journal-slot-waits-for-a-settled-intersection-before-mounting
  (is (false? (journal-state/slot-mounted? true false false))
      "A slot crossed during fast scrolling must not start a complete-tree request immediately."))

(deftest journal-slot-releases-an-offscreen-in-flight-tree
  (is (false? (journal-state/slot-mounted? false false true))
      "An offscreen request must not commit its complete tree into the DOM."))

(deftest journal-slot-keeps-focused-and-settled-visible-content-mounted
  (is (true? (journal-state/slot-mounted? false true false))
      "Focused journal content must remain stable outside the preload window.")
  (is (true? (journal-state/slot-mounted? true false true))
      "A mounted journal that remains near the viewport must stay mounted.")
  (is (false? (journal-state/slot-mounted? false false false))
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
