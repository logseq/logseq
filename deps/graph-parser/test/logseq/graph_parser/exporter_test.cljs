(ns ^:node-only logseq.graph-parser.exporter-test
  (:require [cljs.test :refer [testing is]]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [datascript.core :as d]
            [clojure.string :as string]
            [clojure.set :as set]
            ["path" :as node-path]
            ["fs" :as fs]
            [logseq.common.graph :as common-graph]
            [promesa.core :as p]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [logseq.db.test.helper :as db-test]
            [logseq.db.frontend.rules :as rules]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.db.frontend.content :as db-content]))

;; Helpers
;; =======
;; some have been copied from db-import script

(defn- find-block-by-content [db content]
  (if (instance? js/RegExp content)
    (->> content
         (d/q '[:find [(pull ?b [*]) ...]
                :in $ ?pattern
                :where
                [?b :block/title ?content]
                [?b :block/page]
                [(re-find ?pattern ?content)]]
              db)
         first)
    (->> content
         (d/q '[:find [(pull ?b [*]) ...]
                :in $ ?content
                :where
                [?b :block/title ?content]
                [?b :block/page]]
              db)
         first)))

(defn- extract-rules
  [rules]
  (rules/extract-rules rules/db-query-dsl-rules
                       rules
                       {:deps rules/rules-dependencies}))

(defn- find-block-by-property [db property]
  (d/q '[:find [(pull ?b [*]) ...]
         :in $ ?prop %
         :where (has-property ?b ?prop)]
       db property (extract-rules [:has-property])))

(defn- find-block-by-property-value [db property property-value]
  (->> (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?prop ?prop-value %
              :where (property ?b ?prop ?prop-value)]
            db property property-value (extract-rules [:property]))
       first))

(defn- find-page-by-name [db name]
  (ldb/get-page db name))

(defn- build-graph-files
  "Given a file graph directory, return all files including assets and adds relative paths
   on ::rpath since paths are absolute by default and exporter needs relative paths for
   some operations"
  [dir*]
  (let [dir (node-path/resolve dir*)]
    (->> (common-graph/get-files dir)
         (concat (when (fs/existsSync (node-path/join dir* "assets"))
                   (common-graph/readdir (node-path/join dir* "assets"))))
         (mapv #(hash-map :path %
                          ::rpath (node-path/relative dir* %))))))

(defn- <read-file
  [file]
  (p/let [s (fs/readFileSync (:path file))]
    (str s)))

(defn- notify-user [m]
  (println (:msg m))
  (when (:ex-data m)
    (println "Ex-data:" (pr-str (dissoc (:ex-data m) :error)))
    (println "Stacktrace:")
    (if-let [stack (some-> (get-in m [:ex-data :error]) ex-data :sci.impl/callstack deref)]
      (println (string/join
                "\n"
                (map
                 #(str (:file %)
                       (when (:line %) (str ":" (:line %)))
                       (when (:sci.impl/f-meta %)
                         (str " calls #'" (get-in % [:sci.impl/f-meta :ns]) "/" (get-in % [:sci.impl/f-meta :name]))))
                 (reverse stack))))
      (println (some-> (get-in m [:ex-data :error]) .-stack))))
  (when (= :error (:level m))
    (js/process.exit 1)))

(def default-export-options
  {;; common options
   :rpath-key ::rpath
   :notify-user notify-user
   :<read-file <read-file
   ;; :set-ui-state prn
   ;; config file options
   ;; TODO: Add actual default
   :default-config {}})

;; Copied from db-import script and tweaked for an in-memory import
(defn- import-file-graph-to-db
  "Import a file graph dir just like UI does. However, unlike the UI the
  exporter receives file maps containing keys :path and ::rpath since :path
  are full paths"
  [file-graph-dir conn {:keys [assets] :or {assets (atom [])} :as options}]
  (let [*files (build-graph-files file-graph-dir)
        config-file (first (filter #(string/ends-with? (:path %) "logseq/config.edn") *files))
        _ (assert config-file "No 'logseq/config.edn' found for file graph dir")
        options' (merge default-export-options
                        {:user-options (merge {:convert-all-tags? false} (dissoc options :assets :verbose))
                        ;; asset file options
                         :<copy-asset #(swap! assets conj %)}
                        (select-keys options [:verbose]))]
    (gp-exporter/export-file-graph conn conn config-file *files options')))

(defn- import-files-to-db
  "Import specific doc files for dev purposes"
  [files conn options]
  (reset! gp-block/*export-to-db-graph? true)
  (-> (p/let [doc-options (gp-exporter/build-doc-options (merge {:macros {} :file/name-format :triple-lowbar}
                                                                (:user-config options))
                                                         (merge default-export-options
                                                                {:user-options (merge {:convert-all-tags? false}
                                                                                      (dissoc options :user-config :verbose))}
                                                                (select-keys options [:verbose])))
              files' (mapv #(hash-map :path %) files)
              _ (gp-exporter/export-doc-files conn files' <read-file doc-options)]
        {:import-state (:import-state doc-options)})
      (p/finally (fn [_]
                   (reset! gp-block/*export-to-db-graph? false)))))

(defn- readable-properties
  [db query-ent]
  (->> (db-property/properties query-ent)
       (map (fn [[k v]]
              (if (boolean? v)
                [k v]
                [k
                 (if-let [built-in-type (get-in db-property/built-in-properties [k :schema :type])]
                   (if (= :block/tags k)
                     (->> (mapv #(:db/ident (d/entity db (:db/id %))) v)
                          (remove #{:logseq.class/Tag :logseq.class/Property}))
                     (if (db-property-type/all-ref-property-types built-in-type)
                       (db-property/ref->property-value-contents db v)
                       v))
                   (db-property/ref->property-value-contents db v))])))
       (into {})))

;; Tests
;; =====

(deftest-async ^:integration export-docs-graph-with-convert-all-tags
  (p/let [file-graph-dir "test/resources/docs-0.10.9"
          _ (docs-graph-helper/clone-docs-repo-if-not-exists file-graph-dir "v0.10.9")
          conn (db-test/create-conn)
          _ (db-pipeline/add-listener conn)
          {:keys [import-state]}
          (import-file-graph-to-db file-graph-dir conn {:convert-all-tags? true})]

    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")
    (is (= 0 (count @(:ignored-properties import-state))) "No ignored properties")))

(deftest-async export-basic-graph-with-convert-all-tags
  ;; This graph will contain basic examples of different features to import
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (db-test/create-conn)
          ;; Calculate refs and path-refs like frontend
          _ (db-pipeline/add-listener conn)
          assets (atom [])
          {:keys [import-state]} (import-file-graph-to-db file-graph-dir conn {:assets assets :convert-all-tags? true})]

    (testing "whole graph"

      (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
          "Created graph has no validation errors")

      ;; Counts
      ;; Includes journals as property values e.g. :logseq.task/deadline
      (is (= 24 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Journal]] @conn))))

      (is (= 4 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Task]] @conn))))
      (is (= 3 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Query]] @conn))))
      (is (= 2 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Card]] @conn))))

      ;; Don't count pages like url.md that have properties but no content
      (is (= 10
             (count (->> (d/q '[:find [(pull ?b [:block/title :block/tags]) ...]
                                :where [?b :block/title] [_ :block/page ?b] (not [?b :logseq.property/built-in?])] @conn)
                         (filter ldb/internal-page?))))
          "Correct number of pages with block content")
      (is (= 11 (->> @conn
                     (d/q '[:find [?ident ...]
                            :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                     count))
          "Correct number of user classes")
      (is (= 4 (count (d/datoms @conn :avet :block/tags :logseq.class/Whiteboard))))
      (is (= 0 (count @(:ignored-properties import-state))) ":filters should be the only ignored property")
      (is (= 1 (count @assets))))

    (testing "logseq files"
      (is (= ".foo {}\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.css"] [?b :file/content ?content]] @conn))))
      (is (= "logseq.api.show_msg('hello good sir!');\n"
             (ffirst (d/q '[:find ?content :where [?b :file/path "logseq/custom.js"] [?b :file/content ?content]] @conn)))))

    (testing "favorites"
      (is (= #{"Interstellar" "some page"}
             (->>
              (ldb/get-page-blocks @conn
                                   (:db/id (ldb/get-page @conn common-config/favorites-page-name))
                                   {:pull-keys '[* {:block/link [:block/title]}]})
              (map #(get-in % [:block/link :block/title]))
              set))))

    (testing "user properties"
      (is (= 18
             (->> @conn
                  (d/q '[:find [(pull ?b [:db/ident]) ...]
                         :where [?b :block/tags :logseq.class/Property]])
                  (remove #(db-malli-schema/internal-ident? (:db/ident %)))
                  count))
          "Correct number of user properties")
      (is (= #{{:db/ident :user.property/prop-bool :block/schema {:type :checkbox}}
               {:db/ident :user.property/prop-string :block/schema {:type :default}}
               {:db/ident :user.property/prop-num :block/schema {:type :number}}
               {:db/ident :user.property/sameas :block/schema {:type :url}}
               {:db/ident :user.property/rangeincludes :block/schema {:type :node}}
               {:db/ident :user.property/startedat :block/schema {:type :date}}}
             (->> @conn
                  (d/q '[:find [(pull ?b [:db/ident :block/schema]) ...]
                         :where [?b :block/tags :logseq.class/Property]])
                  (filter #(contains? #{:prop-bool :prop-string :prop-num :rangeincludes :sameas :startedat}
                                      (keyword (name (:db/ident %)))))
                  set))
          "Main property types have correct inferred :type")
      (is (= :default
             (get-in (d/entity @conn :user.property/description) [:block/schema :type]))
          "Property value consisting of text and refs is inferred as :default")
      (is (= :url
             (get-in (d/entity @conn :user.property/url) [:block/schema :type]))
          "Property value with a macro correctly inferred as :url")

      (is (= {:user.property/prop-bool true
              :user.property/prop-num 5
              :user.property/prop-string "woot"}
             (update-vals (db-property/properties (find-block-by-content @conn "b1"))
                          (fn [v] (if (map? v) (db-property/ref->property-value-content @conn v) v))))
          "Basic block has correct properties")
      (is (= #{"prop-num" "prop-string" "prop-bool"}
             (->> (d/entity @conn (:db/id (find-block-by-content @conn "b1")))
                  :block/refs
                  (map :block/title)
                  set))
          "Block with properties has correct refs")

      (is (= {:user.property/prop-num2 10
              :block/tags [:logseq.class/Page]}
             (readable-properties @conn (find-page-by-name @conn "new page")))
          "New page has correct properties")
      (is (= {:user.property/prop-bool true
              :user.property/prop-num 5
              :user.property/prop-string "yeehaw"
              :block/tags [:logseq.class/Page]}
             (readable-properties @conn (find-page-by-name @conn "some page")))
          "Existing page has correct properties")

      (is (= {:user.property/rating 5.5}
             (readable-properties @conn (find-block-by-content @conn ":rating float")))
          "Block with float property imports as a float"))

    (testing "built-in properties"
      (is (= [(:db/id (find-block-by-content @conn "original block"))]
             (mapv :db/id (:block/refs (find-block-by-content @conn #"ref to"))))
          "block with a block-ref has correct :block/refs")

      (let [b (find-block-by-content @conn #"MEETING TITLE")]
        (is (= {}
               (and b (readable-properties @conn b)))
            ":template properties are ignored to not invalidate its property types"))

      (is (= {:logseq.task/deadline "Nov 26th, 2022"}
             (readable-properties @conn (find-block-by-content @conn "only deadline")))
          "deadline block has correct journal as property value")

      (is (= {:logseq.task/deadline "Nov 25th, 2022"}
             (readable-properties @conn (find-block-by-content @conn "only scheduled")))
          "scheduled block converted to correct deadline")

      (is (= {:logseq.task/priority "High"}
             (readable-properties @conn (find-block-by-content @conn "high priority")))
          "priority block has correct property")

      (is (= {:logseq.task/status "Doing" :logseq.task/priority "Medium" :block/tags [:logseq.class/Task]}
             (readable-properties @conn (find-block-by-content @conn "status test")))
          "status block has correct task properties and class")

      (is (= #{:logseq.task/status :block/tags}
             (set (keys (readable-properties @conn (find-block-by-content @conn "old todo block")))))
          "old task properties like 'todo' are ignored")

      (is (= {:logseq.property/order-list-type "number"}
             (readable-properties @conn (find-block-by-content @conn "list one")))
          "numered block has correct property")

      (is (= #{"gpt"}
             (:block/alias (readable-properties @conn (find-page-by-name @conn "chat-gpt"))))
          "alias set correctly")

      (is (= {:logseq.property.linked-references/includes #{"Oct 9th, 2024"}
              :logseq.property.linked-references/excludes #{"ref2"}}
             (select-keys (readable-properties @conn (find-page-by-name @conn "chat-gpt"))
                          [:logseq.property.linked-references/excludes :logseq.property.linked-references/includes]))
          "linked ref filters set correctly"))

    (testing "built-in classes and their properties"
      ;; Queries
      (is (= {:logseq.property.table/sorting [{:id :user.property/prop-num, :asc? false}]
              :logseq.property.view/type "Table View"
              :logseq.property.table/ordered-columns [:block/title :user.property/prop-string :user.property/prop-num]
              :logseq.property/query "(property :prop-string)"
              :block/tags [:logseq.class/Query]}
             (readable-properties @conn (find-block-by-property-value @conn :logseq.property/query "(property :prop-string)")))
          "simple query block has correct query properties")
      (is (= "For example, here's a query with title text:"
             (:block/title (find-block-by-content @conn #"query with title text")))
          "Text around a simple query block is set as a query's title")
      (is (= {:logseq.property.view/type "List View"
              :logseq.property/query "{:query (task todo doing)}"
              :block/tags [:logseq.class/Query]
              :logseq.property.table/ordered-columns [:block/title]}
             (readable-properties @conn (find-block-by-content @conn #"tasks with")))
          "Advanced query has correct query properties")
      (is (= "tasks with todo and doing"
             (:block/title (find-block-by-content @conn #"tasks with")))
          "Advanced query has custom title migrated")

      ;; Cards
      (is (= {:block/tags [:logseq.class/Card]}
             (readable-properties @conn (find-block-by-content @conn "card 1")))
          "None of the card properties are imported since they are deprecated"))

    (testing "tags convert to classes"
      (is (= :user.class/Quotes___life
             (:db/ident (find-page-by-name @conn "life")))
          "Namespaced tag's ident has hierarchy to make it unique")

      (is (= ["Tag" "Page"]
             (d/q '[:find [?t-title ...]
                    :where
                    [?b :block/name "life"]
                    [?b :block/tags ?t]
                    [?t :block/title ?t-title]] @conn))
          "When a class is used and referenced on the same page, there should only be one instance of it")

      (is (= ["life"]
             (->> (:block/tags (find-block-by-content @conn #"with namespace tag"))
                  (mapv #(db-property/ref->property-value-contents @conn %))))
          "Block tagged with namespace tag is only associated with leaf child tag"))

    (testing "namespaces"
      (let [expand-children (fn expand-children [ent parent]
                              (if-let [children (:logseq.property/_parent ent)]
                                (cons {:parent (:block/title parent) :child (:block/title ent)}
                                      (mapcat #(expand-children % ent) children))
                                [{:parent (:block/title parent) :child (:block/title ent)}]))]
        (is (= [{:parent "n1" :child "x"}
                {:parent "x" :child "z"}
                {:parent "x" :child "y"}]
               (rest (expand-children (d/entity @conn (:db/id (find-page-by-name @conn "n1"))) nil)))
            "First namespace tests duplicate parent page name")
        (is (= [{:parent "n2" :child "x"}
                {:parent "x" :child "z"}
                {:parent "n2" :child "alias"}]
               (rest (expand-children (d/entity @conn (:db/id (find-page-by-name @conn "n2"))) nil)))
            "First namespace tests duplicate child page name and built-in page name")))

    (testing "journal timestamps"
      (is (= (date-time-util/journal-day->ms 20240207)
             (:block/created-at (find-page-by-name @conn "Feb 7th, 2024")))
          "journal pages are created on their journal day")
      (is (= (date-time-util/journal-day->ms 20240207)
             (:block/created-at (find-block-by-content @conn #"Inception")))
          "journal blocks are created on their page's journal day"))

    (testing "db attributes"
      (is (= true
             (:block/collapsed? (find-block-by-content @conn "collapsed block")))
          "Collapsed blocks are imported"))

    (testing "property :type changes"
      (is (= :node
             (get-in (d/entity @conn :user.property/finishedat) [:block/schema :type]))
          ":date property to :node value changes to :node")
      (is (= :node
             (get-in (d/entity @conn :user.property/participants) [:block/schema :type]))
          ":node property to :date value remains :node")

      (is (= :default
             (get-in (d/entity @conn :user.property/description) [:block/schema :type]))
          ":default property to :node (or any non :default value) remains :default")
      (is (= "[[Jakob]]"
             (:user.property/description (readable-properties @conn (find-block-by-content @conn #":default to :node"))))
          ":default to :node property saves :default property value default with full text")

      (testing "with changes to upstream/existing property value"
        (is (= :default
               (get-in (d/entity @conn :user.property/duration) [:block/schema :type]))
            ":number property to :default value changes to :default")
        (is (= "20"
               (:user.property/duration (readable-properties @conn (find-block-by-content @conn "existing :number to :default"))))
            "existing :number property value correctly saved as :default")

        (is (= {:block/schema {:type :default} :db/cardinality :db.cardinality/many}
               (select-keys (d/entity @conn :user.property/people) [:block/schema :db/cardinality]))
            ":node property to :default value changes to :default and keeps existing cardinality")
        (is (= #{"[[Jakob]] [[Gabriel]]"}
               (:user.property/people (readable-properties @conn (find-block-by-content @conn ":node people"))))
            "existing :node property value correctly saved as :default with full text")
        (is (= #{"[[Gabriel]] [[Jakob]]"}
               (:user.property/people (readable-properties @conn (find-block-by-content @conn #"pending block for :node"))))
            "pending :node property value correctly saved as :default with full text")
        (is (some? (find-page-by-name @conn "Jakob"))
            "Previous :node property value still exists")
        (is (= 3 (count (find-block-by-property @conn :user.property/people)))
            "Converted property has correct number of property values")))

    (testing "imported concepts can have names of new-built concepts"
      (is (= #{:logseq.property/description :user.property/description}
             (set (d/q '[:find [?ident ...] :where [?b :db/ident ?ident] [?b :block/name "description"]] @conn)))
          "user description property is separate from built-in one")
      (is (= #{"Page" "Tag"}
             (set (d/q '[:find [?t-title ...] :where
                         [?b :block/tags ?t]
                         [?b :block/name "task"]
                         [?t :block/title ?t-title]] @conn)))
          "user page is separate from built-in class"))

    (testing "multiline blocks"
      (is (= "|markdown| table|\n|some|thing|" (:block/title (find-block-by-content @conn #"markdown.*table"))))
      (is (= "multiline block\na 2nd\nand a 3rd" (:block/title (find-block-by-content @conn #"multiline block"))))
      (is (= "logbook block" (:block/title (find-block-by-content @conn #"logbook block")))))

    (testing ":block/refs and :block/path-refs"
      (let [page (find-page-by-name @conn "chat-gpt")]
        (is (set/subset?
             #{"type" "LargeLanguageModel"}
             (->> page :block/refs (map #(:block/title (d/entity @conn (:db/id %)))) set))
            "Page has correct property and property value :block/refs")
        (is (set/subset?
             #{"type" "LargeLanguageModel"}
             (->> page :block/path-refs (map #(:block/title (d/entity @conn (:db/id %)))) set))
            "Page has correct property and property value :block/path-refs"))

      (let [block (find-block-by-content @conn "old todo block")]
        (is (set/subset?
             #{:logseq.task/status :logseq.class/Task}
             (->> block
                  :block/refs
                  (map #(:db/ident (d/entity @conn (:db/id %))))
                  set))
            "Block has correct task tag and property :block/refs")
        (is (set/subset?
             #{:logseq.task/status :logseq.class/Task}
             (->> block
                  :block/path-refs
                  (map #(:db/ident (d/entity @conn (:db/id %))))
                  set))
            "Block has correct task tag and property :block/path-refs")))

    (testing "whiteboards"
      (let [block-with-props (find-block-by-content @conn #"block with props")]
        (is (= {:user.property/prop-num 10}
               (readable-properties @conn block-with-props)))
        (is (= "block with props" (:block/title block-with-props)))))))

(deftest-async export-basic-graph-with-convert-all-tags-option-disabled
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (db-test/create-conn)
          {:keys [import-state]}
          (import-file-graph-to-db file-graph-dir conn {:convert-all-tags? false})]

    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")
    (is (= 0 (count @(:ignored-properties import-state))) "No ignored properties")
    (is (= 0 (->> @conn
                  (d/q '[:find [?ident ...]
                         :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                  count))
        "Correct number of user classes")

    (is (= 4 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Task]] @conn))))
    (is (= 3 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Query]] @conn))))
    (is (= 2 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Card]] @conn))))

    (testing "replacing refs in :block/title when :remove-inline-tags? set"
      (is (= 2
             (->> (find-block-by-content @conn #"replace with same start string")
                  :block/title
                  (re-seq db-content/id-ref-pattern)
                  distinct
                  count))
          "A block with ref names that start with same string has 2 distinct refs")

      (is (= 1
             (->> (find-block-by-content @conn #"replace case insensitive")
                  :block/title
                  (re-seq db-content/id-ref-pattern)
                  distinct
                  count))
          "A block with different case of same ref names has 1 distinct ref"))

    (testing "tags convert to page, refs and page-tags"
      (let [block (find-block-by-content @conn #"Inception")
            tag-page (find-page-by-name @conn "Movie")
            tagged-page (find-page-by-name @conn "Interstellar")]
        (is (string/starts-with? (str (:block/title block)) "Inception [[")
            "tagged block tag converts tag to page ref")
        (is (= [(:db/id tag-page)] (map :db/id (:block/refs block)))
            "tagged block has correct refs")
        (is (and tag-page (not (ldb/class? tag-page)))
            "tag page is not a class")

        (is (= {:logseq.property/page-tags #{"Movie"}}
               (readable-properties @conn tagged-page))
            "tagged page has existing page imported as a tag to page-tags")
        (is (= #{"LargeLanguageModel" "fun" "ai"}
               (:logseq.property/page-tags (readable-properties @conn (find-page-by-name @conn "chat-gpt"))))
            "tagged page has new page and other pages marked with '#' and '[[]]` imported as tags to page-tags")))))

(deftest-async export-files-with-tag-classes-option
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_02_07.md" "pages/Interstellar.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:tag-classes ["movie"]})]
    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")

    (let [block (find-block-by-content @conn #"Inception")
          tag-page (find-page-by-name @conn "Movie")
          another-tag-page (find-page-by-name @conn "p0")]
      (is (= (:block/title block) "Inception")
          "tagged block with configured tag strips tag from content")
      (is (= [:user.class/Movie]
             (:block/tags (readable-properties @conn block)))
          "tagged block has configured tag imported as a class")

      (is (= :logseq.class/Tag (:db/ident (first (:block/tags tag-page))))
          "configured tag page in :tag-classes is a class")
      (is (and another-tag-page (not (ldb/class? another-tag-page)))
          "unconfigured tag page is not a class")

      (is (= {:block/tags [:user.class/Movie]}
             (readable-properties @conn (find-page-by-name @conn "Interstellar")))
          "tagged page has configured tag imported as a class"))))

(deftest-async export-files-with-property-classes-option
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %)
                      ["journals/2024_02_23.md" "pages/url.md" "pages/Whiteboard___Tool.md"
                       "pages/Whiteboard___Arrow_head_toggle.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:property-classes ["type"]})
          _ (@#'gp-exporter/export-class-properties conn conn)]

    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")

    (is (= #{:user.class/Property :user.class/Movie :user.class/Class :user.class/Tool}
           (->> @conn
                (d/q '[:find [?ident ...]
                       :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                set))
        "All classes are correctly defined by :type")

    (is (= #{:user.property/url :user.property/sameas :user.property/rangeincludes}
           (->> (d/entity @conn :user.class/Property)
                :logseq.property.class/properties
                (map :db/ident)
                set))
        "Properties are correctly inferred for a class")

    (let [block (find-block-by-content @conn #"The Creator")
          tag-page (find-page-by-name @conn "Movie")]
      (is (= (:block/title block) "The Creator")
          "tagged block with configured tag strips tag from content")
      (is (= [:user.class/Movie]
             (:block/tags (readable-properties @conn block)))
          "tagged block has configured tag imported as a class")
      (is (= (:user.property/testtagclass block) (:block/tags block))
          "tagged block can have another property that references the same class it is tagged with,
           without creating a duplicate class")

      (is (= :logseq.class/Tag (:db/ident (first (:block/tags tag-page))))
          "configured tag page derived from :property-classes is a class")
      (is (nil? (find-page-by-name @conn "type"))
          "No page exists for configured property")

      (is (= [:user.class/Property]
             (:block/tags (readable-properties @conn (find-page-by-name @conn "url"))))
          "tagged page has configured tag imported as a class"))))

(deftest-async export-files-with-remove-inline-tags
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_02_07.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:remove-inline-tags? false :convert-all-tags? true})]

    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")
    (is (string/starts-with? (:block/title (find-block-by-content @conn #"Inception"))
                             "Inception #Movie")
        "block with tag preserves inline tag")))

(deftest-async export-files-with-ignored-properties
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["ignored/icon-page.md"])
          conn (db-test/create-conn)
          {:keys [import-state]} (import-files-to-db files conn {})]
    (is (= 2
           (count (filter #(= :icon (:property %)) @(:ignored-properties import-state))))
        "icon properties are visibly ignored in order to not fail import")))

(deftest-async export-files-with-property-parent-classes-option
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["pages/CreativeWork.md" "pages/Movie.md" "pages/type.md"
                                                          "pages/Whiteboard___Tool.md" "pages/Whiteboard___Arrow_head_toggle.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:property-parent-classes ["parent"]
                                            ;; Also add this option to trigger some edge cases with namespace pages
                                            :property-classes ["type"]})]

    (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
        "Created graph has no validation errors")

    (is (= #{:user.class/Movie :user.class/CreativeWork :user.class/Thing
             :user.class/Class :user.class/Tool :user.class/Whiteboard___Tool}
           (->> @conn
                (d/q '[:find [?ident ...]
                       :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                set))
        "All classes are correctly defined by :type")

    (is (= "CreativeWork" (get-in (d/entity @conn :user.class/Movie) [:logseq.property/parent :block/title]))
        "Existing page correctly set as class parent")
    (is (= "Thing" (get-in (d/entity @conn :user.class/CreativeWork) [:logseq.property/parent :block/title]))
        "New page correctly set as class parent")))

(deftest-async export-config-file-sets-title-format
  (p/let [conn (db-test/create-conn)
          read-file #(p/do! (pr-str {:journal/page-title-format "yyyy-MM-dd"}))
          _ (gp-exporter/export-config-file conn "logseq/config.edn" read-file {})]
    (is (= "yyyy-MM-dd"
           (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal)))
        "title format set correctly by config")))
