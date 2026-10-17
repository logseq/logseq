(ns ^:node-only logseq.graph-parser.exporter-mutation-test
  "Mutation-driven tests for logseq.graph-parser.exporter. Most call private fns
  directly; the import-level tests copy their harness from exporter-test."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

;; add-missing-timestamps
;; ======================

;; Fails if, in `add-missing-timestamps`, `or` becomes `and`.
(deftest add-missing-timestamps-file-page-with-only-one-file-time
  (let [f #'gp-exporter/add-missing-timestamps
        created-only (f {::gp-exporter/file-page? true} {:file-created-at 1000})
        updated-only (f {::gp-exporter/file-page? true} {:file-updated-at 2000})]
    (is (= 1000 (:block/created-at created-only) (:block/updated-at created-only)))
    (is (= 2000 (:block/created-at updated-only) (:block/updated-at updated-only)))))

;; template blocks
;; ===============

;; Fails if, in `get-parent-uuid`, `and` becomes `or`.
(deftest get-parent-uuid-reads-uuid-lookup-refs-and-maps-only
  (let [f #'gp-exporter/get-parent-uuid]
    (is (= 1 (f [:block/uuid 1])))
    (is (= 2 (f {:block/uuid 2})))
    (is (nil? (f [:block/name "x"])))
    (is (nil? (f {:block/name "x"})))
    (is (nil? (f nil)))))

;; Fails if, in `handle-template-blocks`, `and` becomes `or`.
(deftest handle-template-blocks-leaves-plain-blocks-alone
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        {:keys [blocks]} (#'gp-exporter/handle-template-blocks
                          [{:block/uuid parent-uuid}
                           {:block/uuid child-uuid :block/parent [:block/uuid parent-uuid]}])]
    (is (= [parent-uuid child-uuid] (map :block/uuid blocks)))
    (is (= [:block/uuid parent-uuid] (:block/parent (second blocks))))))

;; tags
;; ====

;; Fails if, in `convert-tag?`, `or` becomes `and`.
(deftest convert-tag?-built-in-card-tag
  (let [f #'gp-exporter/convert-tag?]
    (is (true? (f "card" {})))
    (is (true? (f "foo" {:convert-all-tags? true})))
    (is (true? (f "foo" {:tag-classes #{"foo"}})))
    (is (false? (f "foo" {})))
    (is (false? (f "tags" {:convert-all-tags? true})))))

;; Fails if, in `logseq-class-ident?`, `and` becomes `or`.
(deftest logseq-class-ident?-needs-logseq-class-namespace
  (is (true? (#'gp-exporter/logseq-class-ident? :logseq.class/Task)))
  (is (false? (#'gp-exporter/logseq-class-ident? :foo/bar)))
  (is (false? (#'gp-exporter/logseq-class-ident? :bar))))

;; Fails if, in `convert-tags-to-classes`, `logseq-class-ident?` is negated or the tags are reordered.
(deftest convert-tags-to-classes-keeps-class-idents-in-order
  (is (= [:logseq.class/Task :logseq.class/Query]
         (#'gp-exporter/convert-tags-to-classes [:logseq.class/Task :logseq.class/Query] nil nil nil nil))))

;; Fails if, in `convert-tags-to-classes`, `keep` becomes `map`: a tag that is not
;; converted (`convert-tag?` false for "child" with no options) is left out, and the
;; block's other tags stay (#13758).
(deftest convert-tags-to-classes-leaves-out-unconverted-tags-and-keeps-the-others
  (is (= [:logseq.class/Task :logseq.class/Query]
         (#'gp-exporter/convert-tags-to-classes
          [{:block/name "child" :block/namespace {:block/name "parent"}}
           :logseq.class/Task
           :logseq.class/Query]
          nil nil {} nil))))

;; Fails if, in `update-page-tags`, `seq` becomes `empty?`.
(deftest update-page-tags-records-unconverted-tags-as-page-tags
  (let [tag-uuid (random-uuid)
        state {:page-names-to-uuids (atom {"foo" tag-uuid})}
        f #'gp-exporter/update-page-tags
        with-page-tag (f {:block/name "p" :block/tags [{:block/name "foo"}]} nil {} state (atom {}))
        without-page-tag (f {:block/name "p" :block/tags [:logseq.class/Task]} nil {} state (atom {}))]
    (is (= #{[:block/uuid tag-uuid]} (:logseq.property/page-tags with-page-tag)))
    (is (not (contains? without-page-tag :logseq.property/page-tags)))))

;; headings, entities, repeats
;; ===========================

;; Fails if, in `markdown-heading-level`, `when` becomes `when-not`.
(deftest markdown-heading-level-reads-only-strings
  (is (= 2 (#'gp-exporter/markdown-heading-level "## foo")))
  (is (nil? (#'gp-exporter/markdown-heading-level "foo")))
  (is (nil? (#'gp-exporter/markdown-heading-level nil))))

;; Fails if, in `update-block-heading`, `or` becomes `and`.
(deftest update-block-heading-leaves-code-blocks-alone
  (let [block {:logseq.property.node/display-type :code :block/title "# foo"}]
    (is (= block (#'gp-exporter/update-block-heading block)))
    (is (= {:block/title "foo" :logseq.property/heading 1}
           (#'gp-exporter/update-block-heading {:block/title "# foo"})))))

;; Fails if, in `page-entity?`, `or` becomes `and`.
(deftest page-entity?-accepts-page-type-maps
  (is (true? (boolean (#'gp-exporter/page-entity? {:block/type "page"}))))
  (is (true? (boolean (#'gp-exporter/page-entity? {:block/type "journal"}))))
  (is (false? (boolean (#'gp-exporter/page-entity? {:block/type "whiteboard"})))))

;; Fails if, in `repeat-properties`, `and` becomes `or`.
(deftest repeat-properties-need-a-repetition
  (is (nil? (#'gp-exporter/repeat-properties :logseq.property/deadline {:date-int 20260105})))
  (is (nil? (#'gp-exporter/repeat-properties :logseq.property/deadline 20260105)))
  (is (nil? (#'gp-exporter/repeat-properties :logseq.property/deadline nil))))

;; Fails if, in `missing-repeat-type-property-tx`, `when` becomes `when-not`.
(deftest missing-repeat-type-property-tx-only-when-property-is-missing
  (let [conn (db-test/create-conn)]
    (is (nil? (#'gp-exporter/missing-repeat-type-property-tx @conn {})))
    (is (nil? (#'gp-exporter/missing-repeat-type-property-tx
               @conn {:logseq.property.repeat/repeat-type :logseq.property.repeat/repeat-type.plus})))))

;; refs
;; ====

;; Fails if, in `update-block-refs`, `=` becomes `not=`, `first` becomes `last` or `or` becomes `and`.
(deftest update-block-refs-skips-lookup-ref-refs-when-rewriting-title
  (let [bar-uuid (random-uuid)
        res (#'gp-exporter/update-block-refs
             {:block/title "see [[bar]]"
              :block/refs [[:block/uuid (random-uuid)]
                           {:block/name "bar" :block/title "bar" :block/uuid bar-uuid}]}
             (atom {"bar" bar-uuid}))]
    (is (= (str "see [[" bar-uuid "]]") (:block/title res)))
    (is (= [[:block/uuid bar-uuid]] (take-last 1 (:block/refs res))))))

;; Fails if, in `block-uuid-ref?`, `=` becomes `not=` or `first` becomes `last`.
(deftest block-uuid-ref?-needs-a-block-uuid-lookup-ref
  (is (true? (#'gp-exporter/block-uuid-ref? [:block/uuid 1])))
  (is (false? (#'gp-exporter/block-uuid-ref? [:block/name "x"])))
  (is (false? (#'gp-exporter/block-uuid-ref? [1 :block/uuid])))
  (is (false? (#'gp-exporter/block-uuid-ref? {:block/uuid 1}))))

;; pages
;; =====

;; Fails if, in `get-page-parents`, `or` becomes `and`.
(deftest get-page-parents-resolves-parent-from-existing-pages
  (let [parent-uuid (random-uuid)
        parent {:block/name "p" :block/uuid parent-uuid}]
    (is (= [parent]
           (#'gp-exporter/get-page-parents {:block/parent {:block/uuid parent-uuid}}
                                           {parent-uuid parent})))
    (is (thrown? :default
                 (#'gp-exporter/get-page-parents {:block/parent {:block/uuid parent-uuid}} {})))))

;; Fails if, in `index-saved-page-names!`, `if` becomes `if-not` or `not` becomes `identity`.
(deftest index-saved-page-names!-skips-properties-and-uuidless-pages
  (let [state (gp-exporter/new-import-state)
        [page-uuid prop-uuid user-prop-uuid] (repeatedly 3 random-uuid)]
    (#'gp-exporter/index-saved-page-names!
     state
     [{:block/name "page" :block/uuid page-uuid :block/tags #{:logseq.class/Page}}
      {:block/name "prop" :block/uuid prop-uuid :block/tags #{:logseq.class/Property}}
      {:block/name "user-prop" :block/uuid user-prop-uuid :db/ident :user.property/user-prop}
      {:block/name "no-uuid"}])
    (is (= {"page" page-uuid} @(:page-names-to-uuids state)))))

;; Fails if, in `lookup-imported-page-uuid`, `and` becomes `or`.
(deftest lookup-imported-page-uuid-ignores-built-in-pages
  (let [conn (db-test/create-conn)
        user-page (sqlite-util/build-new-page "My Page")
        _ (d/transact! conn [user-page])
        f #'gp-exporter/lookup-imported-page-uuid]
    (is (= (:block/uuid user-page) (f @conn {} "my page")))
    (is (= :from-map (f @conn {"library" :from-map} "library")))
    (is (nil? (f @conn {} common-config/library-page-name)))
    (is (nil? (f @conn {} nil)))))

;; Fails if, in `build-existing-page`, `and` becomes `or`.
(deftest build-existing-page-applies-file-times-only-to-file-pages
  (let [state (gp-exporter/new-import-state)
        page-uuid (random-uuid)
        per-file-state {:page-names-to-uuids (atom {})}
        options {:import-state state :notify-user (fn [_]) :user-options {}
                 :file-created-at 5}
        f (fn [m] (#'gp-exporter/build-existing-page m nil page-uuid per-file-state options))
        base {:block/name "x" :block/title "x" :block/tags [:logseq.class/Page]}
        plain (f base)
        file-page (f (assoc base ::gp-exporter/file-page? true))
        journal-page (f (assoc base ::gp-exporter/file-page? true :block/journal-day 20260105))]
    (is (not (contains? plain :block/created-at)))
    (is (not (contains? plain :block/updated-at)))
    (is (= 5 (:block/created-at file-page) (:block/updated-at file-page)))
    (is (not (contains? journal-page :block/created-at)))))

;; Fails if, in `modify-page-tx`, `if` becomes `if-not`, `and` becomes `or` or `not` becomes `identity`.
(deftest modify-page-tx-assigns-new-uuids-to-new-built-in-named-pages
  (let [f #'gp-exporter/modify-page-tx
        page-uuid (random-uuid)
        built-in {:block/name "alias" :block/uuid page-uuid :block/format :markdown}
        new-page (f built-in {})
        existing-page (f built-in {"alias" (random-uuid)})]
    (is (not= page-uuid (:block/uuid new-page)))
    (is (= [:logseq.class/Page] (:block/tags new-page)))
    (is (not (contains? new-page :block/format)))
    (is (= page-uuid (:block/uuid existing-page)))
    (is (not (contains? existing-page :block/tags)))
    (is (= [:logseq.class/Tag]
           (:block/tags (f (assoc built-in :block/tags [:logseq.class/Tag]) {}))))))

;; Fails if, in `modify-page-tx`, `and` becomes `or`.
(deftest modify-page-tx-leaves-other-pages-alone
  (let [f #'gp-exporter/modify-page-tx
        page-uuid (random-uuid)]
    (is (= {:block/name "plain-page" :block/uuid page-uuid}
           (f {:block/name "plain-page" :block/uuid page-uuid} {})))
    (is (= {:block/name "card" :block/uuid page-uuid}
           (f {:block/name "card" :block/uuid page-uuid} {})))))

;; Fails if, in `modify-page-tx`, `not` becomes `identity`.
(deftest modify-page-tx-flattens-namespace-pages
  (let [f #'gp-exporter/modify-page-tx
        page-uuid (random-uuid)
        namespace-page {:block/name "a/b" :block/title "a/b" :block/uuid page-uuid
                        :block/namespace {:block/name "a"}}
        flattened (f namespace-page {})
        journal (f (assoc namespace-page :block/journal-day 20260105) {})]
    (is (= "a/b" (::gp-exporter/original-name flattened)))
    (is (= "b" (:block/title flattened)))
    (is (not (contains? journal ::gp-exporter/original-name)))
    (is (= "a/b" (:block/title journal)))))

;; Fails if, in `sanitize-page-aliases-for-import!`, `if` becomes `if-not`.
(deftest sanitize-page-aliases-reports-duplicate-owner-before-alias-owns-aliases
  (let [ignored (atom [])
        [_x p1 p2] (gp-exporter/sanitize-page-aliases-for-import!
                    [{:block/name "x" :block/alias [{:block/name "y"}]}
                     {:block/name "p1" :block/alias [{:block/name "x"}]}
                     {:block/name "p2" :block/alias [{:block/name "x"}]}]
                    (atom {}) ignored)]
    (is (not (contains? p1 :block/alias)))
    (is (not (contains? p2 :block/alias)))
    (is (= [["p1" :alias/alias-owns-aliases] ["p2" :alias/duplicate-owner]]
           (map (juxt :location :reason) @ignored)))))

;; Fails if, in `fix-extracted-block-tags-and-refs`, `if` becomes `if-not`, `not=` becomes `=` or `seq` becomes `empty?`.
(deftest fix-extracted-block-tags-and-refs-unifies-uuids-per-name
  (let [[u1 u2 u3 u4] (repeatedly 4 random-uuid)
        blocks [{:block/tags [{:block/name "a" :block/uuid u1}]
                 :block/refs [{:block/name "a" :block/uuid u2}]}
                {:block/tags [{:block/name "a" :block/uuid u3}]}
                {:block/properties {:a "x"}
                 :block/refs [{:block/name "a" :block/uuid u4}]}
                {:block/refs [[:block/uuid u2]]}]
        [b1 b2 b3 b4] (#'gp-exporter/fix-extracted-block-tags-and-refs blocks)]
    (is (= u1 (-> b1 :block/tags first :block/uuid)))
    (is (= u1 (-> b1 :block/refs first :block/uuid)))
    (is (= u1 (-> b2 :block/tags first :block/uuid)))
    (is (= u4 (-> b3 :block/refs first :block/uuid))
        "ref of a property keeps its own uuid")
    (is (= [[:block/uuid u2]] (:block/refs b4)))))

;; Fails if, in `fix-extracted-block-tags-and-refs`, `and` becomes `or`.
(deftest fix-extracted-block-tags-and-refs-requires-name-and-uuid
  (is (thrown? :default
               (doall (#'gp-exporter/fix-extracted-block-tags-and-refs
                       [{:block/tags [{:block/name "z"}]}]))))
  (is (thrown? :default
               (doall (#'gp-exporter/fix-extracted-block-tags-and-refs
                       [{:block/tags [{:block/uuid (random-uuid)}]}])))))

;; extract-pages-and-blocks
;; ========================

(defn- extract-file
  [file content options]
  (let [doc-options (gp-exporter/build-doc-options {} {:notify-user (fn [_])})
        conn (db-test/create-conn)]
    (reset! gp-block/*export-to-db-graph? true)
    (try
      (let [result (#'gp-exporter/extract-pages-and-blocks @conn file content (merge doc-options options))]
        {:result result :import-state (:import-state doc-options)})
      (finally
        (reset! gp-block/*export-to-db-graph? false)))))

;; Fails if, in `extract-pages-and-blocks`, `or` becomes `and`, `and` becomes `or` or `if` becomes `if-not`.
(deftest extract-pages-and-blocks-stamps-file-times-on-file-pages-and-blocks-only
  (let [{:keys [result]} (extract-file "/tmp/g/pages/foo.md" "- bar [[baz]]\n" {:file-created-at 5})
        page-by-name (fn [n] (first (filter #(= n (:block/name %)) (:pages result))))]
    (is (= 5 (:block/created-at (page-by-name "foo"))))
    (is (some? (page-by-name "baz")))
    (is (not= 5 (:block/created-at (page-by-name "baz"))))
    (is (seq (:blocks result)))
    (is (every? #(= 5 (:block/created-at %)) (:blocks result)))
    (is (every? #(not (contains? % :block/updated-at)) (:blocks result)))))

;; Fails if, in `extract-pages-and-blocks`, `not` becomes `identity`.
(deftest extract-pages-and-blocks-keeps-journal-pages-off-file-times
  (let [{:keys [result]} (extract-file "/tmp/g/journals/2026_01_05.md" "- a\n"
                                       {:file-created-at 5 :file-updated-at 6})
        journal (first (filter :block/journal-day (:pages result)))]
    (is (some? journal))
    (is (not= 5 (:block/created-at journal)))
    (is (not= 6 (:block/updated-at journal)))
    (is (every? #(= 6 (:block/updated-at %)) (:blocks result)))))

;; Fails if, in `extract-pages-and-blocks`, `when-not` becomes `when`.
(deftest extract-pages-and-blocks-only-reports-unsupported-non-whiteboard-files
  (let [unsupported (:import-state (extract-file "/tmp/g/pages/foo.txt" "x" {}))
        whiteboard (:import-state (extract-file "/tmp/g/whiteboards/a.edn" "{}" {}))]
    (is (= [{:path "/tmp/g/pages/foo.txt" :reason :unsupported-file-format}]
           @(:ignored-files unsupported)))
    (is (empty? @(:ignored-files whiteboard)))))

;; saving imported data
;; ====================

;; Fails if, in `save-from-tx`, `seq` becomes `empty?`.
(deftest save-from-tx-indexes-named-nodes-only
  (let [state (gp-exporter/new-import-state)
        page-uuid (random-uuid)]
    (#'gp-exporter/save-from-tx [{:block/name "foo" :block/uuid page-uuid} {:block/uuid (random-uuid)}]
                                {:import-state state})
    (is (= [page-uuid] (keys @(:all-existing-page-uuids state))))
    (is (= page-uuid (get @(:page-names-to-uuids state) "foo")))
    (testing "no named nodes"
      (#'gp-exporter/save-from-tx [{:block/uuid (random-uuid)}] {:import-state state})
      (is (= [page-uuid] (keys @(:all-existing-page-uuids state)))))))

;; Fails if, in `transact-imported-data!`, `seq` becomes `empty?` or `when` becomes `when-not`.
(deftest transact-imported-data!-skips-empty-tx
  (let [conn (db-test/create-conn)
        state (gp-exporter/new-import-state)
        page (sqlite-util/build-new-page "Foo Bar")
        options {:import-state state}]
    (is (nil? (#'gp-exporter/transact-imported-data! conn [] {::gp-exporter/imported-data? true} options)))
    (is (nil? (ldb/get-page @conn "Foo Bar")))
    (is (some? (#'gp-exporter/transact-imported-data! conn [page] {::gp-exporter/imported-data? true} options)))
    (is (some? (ldb/get-page @conn "Foo Bar")))
    (is (= [(:block/uuid page)] (keys @(:all-existing-page-uuids state))))))

;; logseq files, config and assets
;; ===============================

;; Fails if, in `export-logseq-files`, `first` becomes `last` or `when` becomes `when-not`.
(deftest-async export-logseq-files-saves-first-custom-css-and-js-only
  (let [saved (atom [])
        <read-file (fn [file] (p/resolved (str "content of " (:path file))))
        <save-file (fn [_conn target content] (swap! saved conj [target content]) nil)]
    (p/let [_ (#'gp-exporter/export-logseq-files
               :conn
               [{:path "a/logseq/custom.css"} {:path "b/logseq/custom.css"}]
               <read-file {:<save-file <save-file :notify-user (fn [_])})
            css-only @saved
            _ (reset! saved [])
            _ (#'gp-exporter/export-logseq-files
               :conn
               [{:path "a/logseq/custom.js"} {:path "b/logseq/custom.js"} {:path "a/logseq/config.edn"}]
               <read-file {:<save-file <save-file :notify-user (fn [_])})]
      (is (= [["logseq/custom.css" "content of a/logseq/custom.css"]] css-only))
      (is (= [["logseq/custom.js" "content of a/logseq/custom.js"]] @saved)))))

;; Fails if, in `resolve-zotero-config-path`, `if` becomes `if-not` or `not` becomes `identity`.
(deftest resolve-zotero-config-path-makes-relative-paths-absolute
  (let [config {:zotero/settings-v2 {"default" {:zotero-data-directory "data"
                                                :zotero-linked-attachment-base-directory "/abs/files"}}}
        resolved (#'gp-exporter/resolve-zotero-config-path config {:path "/g/logseq/config.edn"})
        blank (#'gp-exporter/resolve-zotero-config-path
               (assoc-in config [:zotero/settings-v2 "default" :zotero-data-directory] "")
               {:path "/g/logseq/config.edn"})
        relative-config-path (#'gp-exporter/resolve-zotero-config-path config {:path "logseq/config.edn"})]
    (is (= "/g/data" (get-in resolved [:zotero/settings-v2 "default" :zotero-data-directory])))
    (is (= "/abs/files" (get-in resolved [:zotero/settings-v2 "default" :zotero-linked-attachment-base-directory])))
    (is (= "" (get-in blank [:zotero/settings-v2 "default" :zotero-data-directory])))
    (is (= "data" (get-in relative-config-path [:zotero/settings-v2 "default" :zotero-data-directory])))))

;; Fails if, in `read-and-copy-asset-files`, `if` becomes `if-not`, `inc` becomes `dec` or `when` becomes `when-not`.
(deftest-async read-and-copy-asset-files-reads-each-distinct-asset-once
  (let [seen (atom [])
        ui-states (atom [])
        watchdog-state (atom {})
        idxs (atom [])
        _ (add-watch watchdog-state ::idx (fn [_ _ _ new-state] (swap! idxs conj (:file-idx new-state))))
        <read-and-copy (fn [file _assets _handler] (swap! seen conj (:path file)) (p/resolved nil))]
    (p/let [_ (#'gp-exporter/read-and-copy-asset-files
               [{:path "b.png" :rpath "x.png"} {:path "a.png" :rpath "x.png"} {:path "c.png" :rpath "y.png"}]
               <read-and-copy
               {:notify-user (fn [_]) :rpath-key :rpath
                :set-ui-state (fn [k v] (swap! ui-states conj [k v]))
                :import-watchdog {:state watchdog-state}})]
      (is (= ["b.png" "c.png"] @seen))
      (is (= [1 2] @idxs))
      (is (= [1 2] (keep (fn [[k v]] (when (= [:graph/importing-state :current-idx] k) v)) @ui-states))))))

;; Fails if, in `read-and-copy-asset-files`, `seq` becomes `empty?`.
(deftest-async read-and-copy-asset-files-does-nothing-without-assets
  (let [seen (atom [])
        <read-and-copy (fn [file _assets _handler] (swap! seen conj file) (p/resolved nil))]
    (p/let [_ (#'gp-exporter/read-and-copy-asset-files [] <read-and-copy {:notify-user (fn [_]) :rpath-key :path})]
      (is (empty? @seen)))))

;; Fails if, in `read-and-copy-asset-files`, `=` becomes `not=` or `when` becomes `when-not`.
(deftest-async read-and-copy-asset-files-handler-detects-pdf-annotation-edn
  (let [handler (atom nil)
        <read-and-copy (fn [file _assets buffer-handler]
                         (swap! handler assoc (:path file) buffer-handler)
                         (p/resolved nil))
        buffer (js/Buffer.from "{:highlights [1]}")]
    (p/let [_ (#'gp-exporter/read-and-copy-asset-files
               [{:path "a.edn"} {:path "b.png"} {:path "c.edn"}]
               <read-and-copy {:notify-user (fn [_]) :rpath-key :path})]
      (let [edn-result ((get @handler "a.edn") buffer)
            png-result ((get @handler "b.png") buffer)
            other-edn ((get @handler "c.edn") (js/Buffer.from "{:foo 1}"))]
        (is (some? (:pdf-annotation? edn-result)))
        (is (= {:size 3 :edn-content {:highlights [1]}} ((:with-edn-content edn-result) {:size 3})))
        (is (nil? (:pdf-annotation? png-result)))
        (is (= {:size 3} ((:with-edn-content png-result) {:size 3})))
        (is (nil? (:pdf-annotation? other-edn)))
        (is (= {:size 3 :edn-content {:foo 1}} ((:with-edn-content other-edn) {:size 3})))))))

;; Fails if, in `build-doc-options`, `true` becomes `false`.
(deftest build-doc-options-defaults-to-converting-all-tags-and-removing-inline-tags
  (is (= {:remove-inline-tags? true :convert-all-tags? true}
         (:user-options (gp-exporter/build-doc-options {} {}))))
  (is (= {:remove-inline-tags? true :convert-all-tags? false}
         (:user-options (gp-exporter/build-doc-options {} {:user-options {:convert-all-tags? false}})))))

;; Import-level harness (copied and trimmed from exporter-test)
;; =============================================================

(defn- write-temp-file-graph
  [files]
  (let [dir (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-graph-parser-mutation3-"))]
    (doseq [[relative-path content] files]
      (let [file-path (node-path/join dir relative-path)]
        (fs/mkdirSync (node-path/dirname file-path) #js {:recursive true})
        (fs/writeFileSync file-path content)))
    dir))

(defn- build-graph-files
  [dir*]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (concat (when (fs/existsSync (path/path-join dir* "assets"))
                   (common-graph/readdir (path/path-join dir* "assets"))))
         (mapv #(hash-map :path %
                          ::rpath (node-path/relative dir* %))))))

(def ^:private small-graph
  {"logseq/config.edn" "{:preferred-format :markdown\n :journal/page-title-format \"yyyy_MM_dd\"}\n"
   "pages/page one.md" (str "- hello #bar\n  myprop:: val\n"
                            "- see [[parent/child]]\n")
   "journals/2026_01_05.md" "- journal note [[page one]]\n"
   "assets/a.png" "png"})

(defn- import-graph!
  "Imports a file graph with export-file-graph and resolves to what happened during the import.
  file-times maps a relative path to extra keys (e.g. :file-created-at) for that file's map."
  [graph file-times extra-options]
  (let [graph-dir (write-temp-file-graph graph)
        conn (db-test/create-conn)
        seen (atom {:flags [] :skip-store [] :metas [] :notified []})
        files (mapv #(merge % (get file-times (::rpath %))) (build-graph-files graph-dir))
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") files))
        options (merge {:rpath-key ::rpath
                        :notify-user (fn [m] (swap! seen update :notified conj m))
                        :<read-file (fn [file]
                                      (swap! seen update :flags conj @gp-block/*export-to-db-graph?)
                                      (swap! seen update :skip-store conj (:skip-store? @conn))
                                      (p/let [s (fs/readFileSync (:path file))] (str s)))
                        :default-config {}
                        :user-options {:convert-all-tags? true}
                        :<get-file-stat (fn [p] (.stat (js/require "fs/promises") p))
                        :<read-and-copy-asset (fn [file _assets buffer-handler]
                                                (p/let [buffer (fs/readFileSync (:path file))]
                                                  (buffer-handler buffer)
                                                  buffer))}
                       (dissoc extra-options :pre-tx))]
    (when-let [tx (:pre-tx extra-options)]
      (d/transact! conn tx))
    (d/listen! conn ::record (fn [report]
                               (swap! seen update :metas conj {:meta (:tx-meta report)
                                                               :attrs (set (map :a (:tx-data report)))})))
    (p/let [result (gp-exporter/export-file-graph conn conn config-file files options)]
      (assoc @seen :conn conn :result result))))

(defn- import-small-graph!
  [extra-options]
  (import-graph! small-graph {} extra-options))

;; Fails if, in `<add-file-to-db-graph`, `when` becomes `when-not`.
;; Fails if, in `export-doc-file`, `inc` becomes `dec`.
;; Fails if, in `export-doc-files`, `when` becomes `when-not`.
;; Fails if, in `export-class-properties`, `true` becomes `false`.
;; Fails if, in `move-top-parent-pages-to-library`, `true` becomes `false`.
;; Fails if, in `<export-file-graph-steps`, `or` becomes `and`, `false` becomes `true` or `when` becomes `when-not`.
;; Fails if, in `export-file-graph`, `or` becomes `and`, `true` becomes `false` or `false` becomes `true`.
(deftest-async export-file-graph-reports-progress-state-and-tx-meta
  (p/let [logs (atom [])
          ui (atom [])
          reports (atom [])
          idx-state (atom {})
          file-idxs (atom [])
          _ (add-watch idx-state ::idx (fn [_ _ _ new-state] (swap! file-idxs conj (:file-idx new-state))))
          r (import-small-graph! {:log-fn (fn [& args] (swap! logs conj args))
                                  :set-ui-state (fn [k v] (swap! ui conj [k v]))
                                  :on-tx-report (fn [report] (swap! reports conj report))
                                  :import-watchdog {:state idx-state}})
          profile (map second (filter #(= :import-profile (first %)) @logs))
          phases (frequencies (map :phase profile))]
    (is (empty? (:notified r)))
    (testing "the db graph flags are on while reading and off after"
      (is (= [true true true] (:flags r)))
      (is (= [true true true] (:skip-store r)))
      (is (false? @gp-block/*export-to-db-graph?))
      (is (not (contains? @(:conn r) :skip-store?))))
    (testing "every imported tx says so"
      (is (seq (:metas r)))
      (is (every? #(true? (::gp-exporter/imported-data? (:meta %))) (:metas r)))
      (is (every? #(true? (::gp-exporter/new-graph? (:meta %)))
                  (filter #(::gp-exporter/path (:meta %)) (:metas r))))
      (let [class-properties (filter #(contains? (:attrs %) :logseq.property.class/properties) (:metas r))]
        (is (= 1 (count class-properties)))
        (is (true? (::gp-exporter/new-graph? (:meta (first class-properties))))))
      (is (seq (filter #(and (contains? (:attrs %) :block/parent) (not (::gp-exporter/path (:meta %)))) (:metas r)))
          "parent pages moved to the library"))
    (testing "each file logs each phase once and finalize logs once"
      (is (= {:parse 2 :prep 2 :pages-tx 2 :blocks-tx 2 :split 2 :prop-tx 2 :clean-tags 2
              :main-tx 2 :transact 2 :save-tx 2 :upstream 2 :file 2 :finalize-imported-graph 1}
             phases))
      (is (every? number? (map :ms profile)))
      (is (= [["Importing" 2 "files ..."]]
             (map vec (remove #(= :import-profile (first %)) @logs)))))
    (testing "on-tx-report only gets reports"
      (is (= 1 (count @reports)))
      (is (every? some? @reports)))
    (testing "ui state"
      (is (= [[:graph/importing-state :step] :config] (first @ui)))
      (is (= [1 1 2] (keep (fn [[k v]] (when (= [:graph/importing-state :current-idx] k) v)) @ui))
          "1 asset then 2 doc files"))
    (testing "watchdog file idx"
      (is (= [1 2] (dedupe (keep identity @file-idxs)))))))

;; Fails if, in `export-file-graph`, `when` becomes `when-not`.
(deftest-async export-file-graph-without-log-fn-prints-nothing
  (let [printed (atom [])
        orig-print-fn *print-fn*]
    (set! *print-fn* (fn [s] (swap! printed conj s)))
    (-> (import-small-graph! {})
        (p/finally (fn [_ _] (set! *print-fn* orig-print-fn)))
        (p/then (fn [_] (is (empty? @printed)))))))

;; Fails if, in `export-file-graph`, `false` becomes `true`.
(deftest-async export-file-graph-resets-export-flag-after-failure
  (p/let [failure (p/catch (import-small-graph! {:set-ui-state (fn [_ _] (throw (ex-info "boom" {})))})
                           (fn [e] {:failure e}))]
    (is (= "boom" (ex-message (:failure failure))))
    (is (false? @gp-block/*export-to-db-graph?))))

(def ^:private content-graph
  {"logseq/config.edn" "{:preferred-format :markdown\n :journal/page-title-format \"yyyy_MM_dd\"}\n"
   "journals/2026_01_05.md" "- journal note [[ns/child]]\n"
   "pages/query page.md" "- {{query (todo now)}}\n- mentions [[fresh]]\n- repeats\n  SCHEDULED: <2026-01-05 Mon .+1w>\n"
   "pages/embed.md" "- {{embed}}\n"
   "pages/other.md" "- again [[ns/child]]\n"})

(defn- page-by-name [db page-name]
  (d/entity db (first (d/q '[:find [?e ...] :in $ ?n :where [?e :block/name ?n]] db page-name))))

;; Fails if, in `build-repeat-properties`, `if` becomes `if-not`.
;; Fails if, in `handle-block-properties`, `when` becomes `when-not`.
;; Fails if, in `build-pages-tx`, `and` becomes `or` or `not` becomes `identity`.
;; Fails if, in `<add-file-to-db-graph`, `or` becomes `and`.
(deftest-async import-of-content-graph
  (p/let [logs (atom [])
          r (import-graph! content-graph
                           {"journals/2026_01_05.md" {:file-created-at 1700000000000 :file-updated-at 1700000009000}
                            "pages/query page.md" {:file-created-at 1700000000000}
                            "pages/other.md" {:file-created-at 1700000000000 :file-updated-at 1700000005000}}
                           {:<get-file-stat (fn [_] nil)
                            :log-fn (fn [& args] (swap! logs conj args))})
          db @(:conn r)
          journal-ms 1767571200000]
    (is (empty? (:notified r)))
    (testing "query blocks keep their query as a property value"
      (let [query-block (first (filter #(some? (:logseq.property/query %)) (:block/_page (page-by-name db "query page"))))]
        (is (= "(todo now)" (:block/title (:logseq.property/query query-block))))))
    (testing "repeating scheduled blocks"
      (let [block (db-test/find-block-by-content db "repeats")]
        (is (= :logseq.property.repeat/repeat-type.dotted-plus
               (:db/ident (:logseq.property.repeat/repeat-type block))))
        (is (= 1 (:logseq.property/value (:logseq.property.repeat/recur-frequency block))))
        (is (= :logseq.property.repeat/recur-unit.week
               (:db/ident (:logseq.property.repeat/recur-unit block))))))
    (testing "file pages get file times, pages first mentioned in a journal keep the journal day"
      (is (= [1700000000000 1700000000000]
             ((juxt :block/created-at :block/updated-at) (page-by-name db "query page"))))
      (is (= [1700000000000 1700000005000]
             ((juxt :block/created-at :block/updated-at) (page-by-name db "other"))))
      (is (= [journal-ms journal-ms]
             ((juxt :block/created-at :block/updated-at) (page-by-name db "child"))))
      (is (= journal-ms (:block/created-at (page-by-name db "jan 5th, 2026"))))
      (is (not= 1700000009000 (:block/updated-at (page-by-name db "jan 5th, 2026")))
          "a journal file's mtime does not become its page's updated-at")
      (let [fresh (page-by-name db "fresh")]
        (is (some? fresh))
        (is (not= 1700000000000 (:block/created-at fresh)))
        (is (not= 1700000000000 (:block/updated-at fresh)))))
    (testing "namespace page mentioned in two files is created once under its parent"
      (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/name "child"]] db))))
      (is (= "ns" (:block/title (:block/parent (page-by-name db "child"))))))
    (testing "log-fn is passed down to block handling"
      (is (= [:invalid-embed-arguments]
             (map first (remove #(= :import-profile (first %)) (rest @logs))))))))

;; Fails if, in `build-pages-tx`, `or` becomes `and`.
(deftest-async import-references-page-already-in-db
  (let [existing (sqlite-util/build-new-page "Preexisting")]
    (p/let [r (import-graph! {"logseq/config.edn" "{:preferred-format :markdown}\n"
                              "pages/a.md" "- see [[preexisting]]\n"}
                             {}
                             {:pre-tx [existing]})
            db @(:conn r)]
      (is (empty? (:notified r)))
      (is (= (str "see [[" (:block/uuid existing) "]]")
             (:block/title (db-test/find-block-by-content db #"see")))))))

;; Fails if, in `<add-file-to-db-graph`, `or` becomes `and`.
(deftest-async import-of-content-graph-without-log-fn
  (p/let [r (import-graph! content-graph {} {})]
    (is (empty? (:notified r)))
    (is (some? (page-by-name @(:conn r) "embed")))))

(defn- named-entities [db page-name]
  (map #(d/entity db %) (d/q '[:find [?e ...] :in $ ?n :where [?e :block/name ?n]] db page-name)))

;; Fails if, in `build-pages-tx`, `or` becomes `and`.
(deftest-async import-namespace-page-whose-last-part-names-an-existing-class
  (p/let [r (import-graph! {"logseq/config.edn" "{:preferred-format :markdown}\n"
                            "pages/a.md" "- x #Bar\n"
                            "pages/c.md" "- see [[ns/Bar]]\n"}
                           {} {})
          db @(:conn r)
          bars (named-entities db "bar")
          [class-bar page-bar] ((juxt (partial filter ldb/class?) (partial remove ldb/class?)) bars)]
    (is (empty? (:notified r)))
    (is (= 1 (count class-bar)))
    (is (= 1 (count page-bar)) "ns/Bar is built although a class Bar exists")
    (is (= "ns" (:block/title (:block/parent (first page-bar)))))
    (is (= (str "see [[" (:block/uuid (first page-bar)) "]]")
           (:block/title (db-test/find-block-by-content db #"^see"))))))

;; Fails if, in `split-pages-and-properties-tx`, `when-not` becomes `when`.
(deftest-async import-page-used-as-a-property-in-a-later-file
  (p/let [r (import-graph! {"logseq/config.edn" "{:preferred-format :markdown}\n"
                            "pages/a.md" "- see [[foo]]\n"
                            "pages/b.md" "- x\n  foo:: bar\n"}
                           {} {})
          db @(:conn r)
          foos (named-entities db "foo")]
    (is (empty? (:notified r)))
    (is (= [:user.property/foo] (map :db/ident foos)))
    (is (ldb/property? (first foos)))
    (is (= {:user.property/foo "bar"}
           (db-test/readable-properties (db-test/find-block-by-content db "x"))))))

;; Fails if, in `split-pages-and-properties-tx`, `when-not` becomes `when`.
(deftest-async import-property-named-like-an-existing-class
  (p/let [r (import-graph! {"logseq/config.edn" "{:preferred-format :markdown}\n"
                            "pages/a.md" "- x #Foo\n"
                            "pages/b.md" "- y\n  foo:: bar\n"}
                           {} {})
          db @(:conn r)
          foos (named-entities db "foo")
          [class-foo property-foo] ((juxt (partial filter ldb/class?) (partial filter ldb/property?)) foos)]
    (is (empty? (:notified r)))
    (is (= 2 (count foos)))
    (is (= [:user.class/Foo] (map :db/ident class-foo)))
    (is (not (ldb/property? (first class-foo))) "the class is not turned into the property")
    (is (= [:user.property/foo] (map :db/ident property-foo)))
    (is (= {:user.property/foo "bar"}
           (db-test/readable-properties (db-test/find-block-by-content db "y"))))))

;; Fails if, in `export-doc-files`, `true` becomes `false`.
(deftest-async import-hls-page-with-linked-pdf-tags-its-asset-tx
  (p/let [r (import-graph! {"logseq/config.edn" "{:preferred-format :markdown}\n"
                            "pages/hls__Linked Paper.md" (str "file:: [Linked Paper.pdf](https://example.com/Linked%20Paper.pdf)\n\n"
                                                              "- a highlight\n")}
                           {} {})
          asset-metas (filter #(contains? (:attrs %) :logseq.property.asset/external-url) (:metas r))]
    (is (empty? (:notified r)))
    (is (= ["https://example.com/Linked%20Paper.pdf"]
           (d/q '[:find [?u ...] :where [_ :logseq.property.asset/external-url ?u]] @(:conn r))))
    (is (= 1 (count asset-metas)))
    (is (= [true] (map (comp ::gp-exporter/imported-data? :meta) asset-metas)))
    (is (= [true] (map (comp ::gp-exporter/new-graph? :meta) asset-metas)))
    (is (string/ends-with? (::gp-exporter/path (:meta (first asset-metas))) "hls__Linked Paper.md"))))
