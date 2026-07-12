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
      (is (string/includes? block-list-source ":hide-children? true"))
      (is (string/includes? block-list-source "-placeholder-")))))

(deftest flat-virtualized-rows-do-not-load-children-per-row
  (let [source (source-for "src/main/frontend/components/block.cljs")
        block-container-source (form-source source "(hsx/defc block-container\n")]
    (is (some? block-container-source)
        "block-container component should exist")
    (is (string/includes? block-container-source "(not (:hide-children? config))")
        "Flat virtualized row config should be part of the single load-children? decision.")
    (is (string/includes? block-container-source ":children? load-children?")
        "Flat virtualized rows should not issue row-level child hydration; expansion is owned by page-window refresh.")))
