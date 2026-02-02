(ns ^:node-only logseq.graph-parser.exporter-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [are deftest is testing]]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [logseq.graph-parser.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [promesa.core :as p]))

;; Helpers
;; =======
;; some have been copied from db-import script

(defn- extract-rules
  [rules]
  (rules/extract-rules rules/db-query-dsl-rules
                       rules
                       {:deps rules/rules-dependencies}))

(defn- find-block-by-property [db property]
  (d/q '[:find [?b ...]
         :in $ ?prop %
         :where (has-property ?b ?prop)]
       db property (extract-rules [:has-property])))

(defn- find-block-by-property-value [db property property-value]
  (->> (d/q '[:find [?b ...]
              :in $ ?prop ?prop-value %
              :where (property ?b ?prop ?prop-value)]
            db property property-value (extract-rules [:property]))
       first
       (d/entity db)))

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
    (println "Ex-data:" (pr-str (merge (dissoc (:ex-data m) :error)
                                       (when-let [err (get-in m [:ex-data :error])]
                                         {:original-error (ex-data (.-cause err))}))))
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

;; tweaked from db-import
(defn- <read-and-copy-asset [file assets buffer-handler *asset-ids]
  (p/let [buffer (fs/readFileSync (:path file))
          checksum (db-asset/<get-file-array-buffer-checksum buffer)
          asset-id (d/squuid)
          asset-name (gp-exporter/asset-path->name (:path file))
          asset-type (db-asset/asset-path->type (:path file))
          {:keys [with-edn-content pdf-annotation?]} (buffer-handler buffer)]
    (when-not pdf-annotation?
      (swap! *asset-ids conj asset-id))
    (swap! assets assoc asset-name
           (with-edn-content
             {:size (.-length buffer)
              :type asset-type
              :path (:path file)
              :checksum checksum
              :asset-id asset-id}))
    buffer))

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
                         :<read-and-copy-asset (fn [file *assets buffer-handler]
                                                 (<read-and-copy-asset file *assets buffer-handler assets))}
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

;; Tests
;; =====

(deftest update-asset-links-in-block-title
  (are [x y]
       (= y (@#'gp-exporter/update-asset-links-in-block-title (first x) {(second x) "UUID"} (atom {})))
    ;; Standard image link with metadata
    ["![greg-popovich-thumbs-up.png](../assets/greg-popovich-thumbs-up_1704749687791_0.png){:height 288, :width 100} says pop"
     "assets/greg-popovich-thumbs-up_1704749687791_0.png"]
    "[[UUID]] says pop"

    ;; Image link with no metadata
    ["![some-title](../assets/CleanShot_2022-10-12_at_15.53.20@2x_1665561216083_0.png)"
     "assets/CleanShot_2022-10-12_at_15.53.20@2x_1665561216083_0.png"]
    "[[UUID]]"

    ;; 2nd link
    ["[[FIRST UUID]] and ![dino!](assets/subdir/partydino.gif)"
     "assets/subdir/partydino.gif"]
    "[[FIRST UUID]] and [[UUID]]"))

(deftest-async ^:integration export-docs-graph-with-convert-all-tags
  (p/let [file-graph-dir "test/resources/docs-0.10.12"
          start-time (cljs.core/system-time)
          _ (docs-graph-helper/clone-docs-repo-if-not-exists file-graph-dir "v0.10.12")
          conn (db-test/create-conn)
          _ (db-pipeline/add-listener conn)
          {:keys [import-state]}
          (import-file-graph-to-db file-graph-dir conn {:convert-all-tags? true})
          end-time (cljs.core/system-time)]

    ;; Add multiplicative factor for CI as it runs about twice as slow
    (let [max-time (-> 25 (* (if js/process.env.CI 2 1)))]
      (is (< (-> end-time (- start-time) (/ 1000)) max-time)
          (str "Importing large graph takes less than " max-time "s")))

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")
    (is (= 0 (count @(:ignored-properties import-state))) "No ignored properties")
    (is (= 0 (count @(:ignored-assets import-state))) "No ignored assets")
    (is (= []
           (->> (d/q '[:find (pull ?b [:block/title {:block/tags [:db/ident]}])
                       :where [?b :block/tags :logseq.class/Tag]]
                     @conn)
                (map first)
                (remove #(= [{:db/ident :logseq.class/Tag}] (:block/tags %)))))
        "All classes only have :logseq.class/Tag as their tag (and don't have Page)")))

(deftest-async export-basic-graph-with-convert-all-tags
  ;; This graph will contain basic examples of different features to import
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (db-test/create-conn)
          ;; Calculate refs like frontend
          _ (db-pipeline/add-listener conn)
          assets (atom [])
          {:keys [import-state]} (import-file-graph-to-db file-graph-dir conn {:assets assets :convert-all-tags? true})]

    (testing "whole graph"

      (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
          "Created graph has no validation errors")

      ;; Counts
      ;; Includes journals as property values e.g. :logseq.property/deadline
      (is (= 32 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Journal]] @conn))))

      (is (= 5 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Asset]] @conn))))
      (is (= 5 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Task]] @conn))))
      (is (= 4 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Query]] @conn))))
      (is (= 2 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Card]] @conn))))
      (is (= 5 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Quote-block]] @conn))))
      (is (= 2 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Pdf-annotation]] @conn))))

      ;; Properties and tags aren't included in this count as they aren't a Page
      (is (= 11
             (->> (d/q '[:find [?b ...]
                         :where
                         [?b :block/title]
                         [_ :block/page ?b]
                         (not [?b :logseq.property/built-in?])] @conn)
                  (map #(d/entity @conn %))
                  (filter ldb/internal-page?)
                  #_(map #(select-keys % [:block/title :block/tags]))
                  count))
          "Correct number of pages with block content")
      (is (= 15 (->> @conn
                     (d/q '[:find [?ident ...]
                            :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                     count))
          "Correct number of user classes")
      (is (= 0 (count @(:ignored-properties import-state))) "No ignored properties")
      (is (= 0 (count @(:ignored-assets import-state))) "No ignored assets")
      (is (= 1 (count @(:ignored-files import-state))) "Ignore .edn for now")
      (is (= 5 (count @assets))))

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
      (is (= 21
             (->> @conn
                  (d/q '[:find [(pull ?b [:db/ident]) ...]
                         :where [?b :block/tags :logseq.class/Property]])
                  (remove #(db-malli-schema/internal-ident? (:db/ident %)))
                  count))
          "Correct number of user properties")
      (is (= #{{:db/ident :user.property/prop-bool :logseq.property/type :checkbox}
               {:db/ident :user.property/prop-string :logseq.property/type :default}
               {:db/ident :user.property/prop-num :logseq.property/type :number}
               {:db/ident :user.property/sameas :logseq.property/type :url}
               {:db/ident :user.property/rangeincludes :logseq.property/type :node}
               {:db/ident :user.property/startedat :logseq.property/type :date}}
             (->> @conn
                  (d/q '[:find [(pull ?b [:db/ident :logseq.property/type]) ...]
                         :where [?b :block/tags :logseq.class/Property]])
                  (filter #(contains? #{:prop-bool :prop-string :prop-num :rangeincludes :sameas :startedat}
                                      (keyword (name (:db/ident %)))))
                  set))
          "Main property types have correct inferred :type")
      (is (= :default
             (:logseq.property/type (d/entity @conn :user.property/description)))
          "Property value consisting of text and refs is inferred as :default")
      (is (= :url
             (:logseq.property/type (d/entity @conn :user.property/url)))
          "Property value with a macro correctly inferred as :url")

      (is (= {:user.property/prop-bool true
              :user.property/prop-num 5
              :user.property/prop-string "woot"}
             (db-test/readable-properties (db-test/find-block-by-content @conn "b1")))
          "Basic block has correct properties")
      (is (= #{"prop-num" "prop-string" "prop-bool"}
             (->> (db-test/find-block-by-content @conn "b1")
                  :block/refs
                  (map :block/title)
                  set))
          "Block with properties has correct refs")

      (is (= {:user.property/prop-num2 10
              :block/tags [:logseq.class/Page]}
             (db-test/readable-properties (db-test/find-page-by-title @conn "new page")))
          "New page has correct properties")
      (is (= {:user.property/prop-bool true
              :user.property/prop-num 5
              :user.property/prop-string "yeehaw"
              :block/tags [:logseq.class/Page :user.class/SomeNamespace]}
             (db-test/readable-properties (db-test/find-page-by-title @conn "some page")))
          "Existing page has correct properties")

      (is (= {:user.property/rating 5.5}
             (db-test/readable-properties (db-test/find-block-by-content @conn ":rating float")))
          "Block with float property imports as a float")

      (is (= []
             (->> (d/q '[:find (pull ?b [:block/title {:block/tags [:db/ident]}])
                         :where [?b :block/tags :logseq.class/Property]]
                       @conn)
                  (map first)
                  (remove #(= [{:db/ident :logseq.class/Property}] (:block/tags %)))))
          "All properties only have :logseq.class/Property as their tag (and don't have Page)"))

    (testing "built-in properties"
      (is (= [(:db/id (db-test/find-block-by-content @conn "original block"))]
             (mapv :db/id (:block/refs (db-test/find-block-by-content @conn #"ref to"))))
          "block with a block-ref has correct :block/refs")

      (let [b (db-test/find-block-by-content @conn #"MEETING TITLE")]
        (is (= {}
               (and b (db-test/readable-properties b)))
            ":template properties are ignored to not invalidate its property types"))

      (is (= 20221126
             (-> (db-test/readable-properties (db-test/find-block-by-content @conn "only deadline"))
                 :logseq.property/deadline
                 date-time-util/ms->journal-day))
          "deadline block has correct journal as property value")

      (is (= {:logseq.property/scheduled 20221125
              :logseq.property/deadline 20221125}
             (-> (db-test/readable-properties (db-test/find-block-by-content @conn #"deadline and scheduled"))
                 (select-keys [:logseq.property/scheduled :logseq.property/deadline])
                 (update-vals date-time-util/ms->journal-day)))
          "scheduled block converted to correct deadline")

      (is (= 1 (count (d/q '[:find [(pull ?b [*]) ...]
                             :in $ ?content
                             :where [?b :block/title ?content]]
                           @conn "Apr 1st, 2024")))
          "Only one journal page exists when deadline is on same day as journal")

      (is (= {:logseq.property/priority :logseq.property/priority.high}
             (db-test/readable-properties (db-test/find-block-by-content @conn "high priority")))
          "priority block has correct property")

      (is (= {:logseq.property/status :logseq.property/status.doing
              :logseq.property/priority :logseq.property/priority.medium
              :block/tags [:logseq.class/Task]}
             (db-test/readable-properties (db-test/find-block-by-content @conn "status test")))
          "status block has correct task properties and class")

      (is (= #{:logseq.property/status :block/tags}
             (set (keys (db-test/readable-properties (db-test/find-block-by-content @conn "old todo block")))))
          "old task properties like 'todo' are ignored")

      (is (= {:logseq.property/order-list-type "number"}
             (db-test/readable-properties (db-test/find-block-by-content @conn "list one")))
          "numered block has correct property")

      (is (= #{"gpt"}
             (:block/alias (db-test/readable-properties (db-test/find-page-by-title @conn "chat-gpt"))))
          "alias set correctly")
      (is (= ["y"]
             (->> (d/q '[:find [?b ...] :where [?b :block/title "y"] [?b :block/parent]]
                       @conn)
                  first
                  (d/entity @conn)
                  :block/alias
                  (map :block/title)))
          "alias set correctly on namespaced page")

      (is (= {:logseq.property.linked-references/includes #{"Oct 9th, 2024"}
              :logseq.property.linked-references/excludes #{"ref2"}}
             (select-keys (db-test/readable-properties (db-test/find-page-by-title @conn "chat-gpt"))
                          [:logseq.property.linked-references/excludes :logseq.property.linked-references/includes]))
          "linked ref filters set correctly"))

    (testing "built-in classes and their properties"
      ;; Queries
      (is (= {:logseq.property.table/sorting [{:id :user.property/prop-num, :asc? false}]
              :logseq.property.view/type :logseq.property.view/type.table
              :logseq.property.table/ordered-columns [:block/title :user.property/prop-string :user.property/prop-num]
              :logseq.property/query "(property :prop-string)"
              :block/tags [:logseq.class/Query]}
             (db-test/readable-properties (find-block-by-property-value @conn :logseq.property/query "(property :prop-string)")))
          "simple query block has correct query properties")
      (is (= "For example, here's a query with title text:"
             (:block/title (db-test/find-block-by-content @conn #"query with title text")))
          "Text around a simple query block is set as a query's title")
      (is (= {:logseq.property.view/type :logseq.property.view/type.list
              :logseq.property/query "{:query (task todo doing)}"
              :block/tags [:logseq.class/Query]
              :logseq.property.table/ordered-columns [:block/title]}
             (db-test/readable-properties (db-test/find-block-by-content @conn #"tasks with todo")))
          "Advanced query has correct query properties")
      (is (= "tasks with todo and doing"
             (:block/title (db-test/find-block-by-content @conn #"tasks with todo")))
          "Advanced query has custom title migrated")

      ;; Cards
      (is (= {:block/tags [:logseq.class/Card]}
             (db-test/readable-properties (db-test/find-block-by-content @conn "card 1")))
          "None of the card properties are imported since they are deprecated")

      ;; Assets
      (is (= {:block/tags [:logseq.class/Asset]
              :logseq.property.asset/type "png"
              :logseq.property.asset/checksum "3d5e620cac62159d8196c118574bfea7a16e86fa86efd1c3fa15a00a0a08792d"
              :logseq.property.asset/size 753471
              :logseq.property.asset/resize-metadata {:height 288, :width 252}}
             (db-test/readable-properties (db-test/find-block-by-content @conn "greg-popovich-thumbs-up_1704749687791_0")))
          "Asset has correct properties")
      (is (= (d/entity @conn :logseq.class/Asset)
             (:block/page (db-test/find-block-by-content @conn "greg-popovich-thumbs-up_1704749687791_0")))
          "Imported into Asset page")

      ;; Annotations
      (is (= {:logseq.property.pdf/hl-color :logseq.property/color.blue
              :logseq.property.pdf/hl-page 8
              :block/tags [:logseq.class/Pdf-annotation]
              :logseq.property/asset "Sina_de_Capoeria_Batizado_2025_-_Program_Itinerary_1752179325104_0"}
             (dissoc (db-test/readable-properties (db-test/find-block-by-content @conn #"Duke School - modified"))
                     :logseq.property.pdf/hl-value :logseq.property/ls-type))
          "Pdf text highlight has correct properties")
      (is (= ["note about duke" "sub note"]
             (mapv :block/title (rest (ldb/get-block-and-children @conn (:block/uuid (db-test/find-block-by-content @conn #"Duke School - modified"))))))
          "Pdf text highlight has correct children blocks")
      (is (= {:logseq.property.pdf/hl-color :logseq.property/color.yellow
              :logseq.property.pdf/hl-page 1
              :block/tags [:logseq.class/Pdf-annotation]
              :logseq.property/asset "Sina_de_Capoeria_Batizado_2025_-_Program_Itinerary_1752179325104_0"
              :logseq.property.pdf/hl-image "pdf area highlight"
              :logseq.property.pdf/hl-type :area}
             (dissoc (->> (d/q '[:find [?b ...]
                                 :where [?b :block/tags :logseq.class/Pdf-annotation] [?b :block/title ""]] @conn)
                          first
                          (d/entity @conn)
                          db-test/readable-properties)
                     :logseq.property.pdf/hl-value :logseq.property/ls-type))
          "Pdf area highlight has correct properties")

      ;; Quotes
      (is (= {:block/tags [:logseq.class/Quote-block]
              :logseq.property.node/display-type :quote}
             (db-test/readable-properties (db-test/find-block-by-content @conn #"Saito"))))
      (is (= "markdown quote\n[[wut]]\nline 3"
             (:block/title (db-test/find-block-by-content @conn #"markdown quote")))
          "Markdown quote imports as full multi-line quote")
      (is (= "*Italic* ~~Strikethrough~~ ^^Highlight^^ #[[foo]]\n**Learn Datalog Today** is an interactive tutorial designed to teach you the [Datomic](http://datomic.com/) dialect of [Datalog](http://en.wikipedia.org/wiki/Datalog). Datalog is a declarative **database query language** with roots in logic programming. Datalog has similar expressive power as [SQL](http://en.wikipedia.org/wiki/Sql)."
             (:block/title (db-test/find-block-by-content @conn #"Learn Datalog")))
          "Imports full quote with various ast types"))

    (testing "embeds"
      (is (= {:block/title ""}
             (-> (d/q '[:find [(pull ?b [*]) ...]
                        :in $ ?title
                        :where [?b :block/link ?l] [?b :block/page ?bp] [?bp :block/journal-day 20250612] [?l :block/title ?title]]
                      @conn
                      "page embed")
                 first
                 (select-keys [:block/title])))
          "Page embed linked correctly")
      (is (= {:block/title ""}
             (-> (d/q '[:find [(pull ?b [*]) ...]
                        :in $ ?title
                        :where [?b :block/link ?l] [?b :block/page ?bp] [?bp :block/journal-day 20250612] [?l :block/title ?title]]
                      @conn
                      "test block embed")
                 first
                 (select-keys [:block/title])))
          "Block embed linked correctly"))

    (testing "tags convert to classes"
      (is (= :user.class/Quotes___life
             (:db/ident (db-test/find-page-by-title @conn "life")))
          "Namespaced tag's ident has hierarchy to make it unique")

      (is (= [:logseq.class/Tag]
             (map :db/ident (:block/tags (db-test/find-page-by-title @conn "life"))))
          "When a class is used and referenced on the same page, there should only be one instance of it")

      (is (= [:user.class/Quotes___life]
             (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn #"with namespace tag"))))
          "Block tagged with namespace tag is only associated with leaf child tag")

      (is (= #{:user.class/ai :user.class/block-tag :user.class/p1}
             (set (map :db/ident (:block/tags (db-test/find-block-by-content @conn #"Block tags")))))
          "Block with tags through tags property")

      (is (= []
             (->> (d/q '[:find (pull ?b [:block/title {:block/tags [:db/ident]}])
                         :where [?b :block/tags :logseq.class/Tag]]
                       @conn)
                  (map first)
                  (remove #(= [{:db/ident :logseq.class/Tag}] (:block/tags %)))))
          "All classes only have :logseq.class/Tag as their tag (and don't have Page)"))

    (testing "namespaces"
      (let [expand-children (fn expand-children [ent parent]
                              (if-let [children (:block/_parent ent)]
                                (cons {:parent (:block/title parent) :child (:block/title ent)}
                                      (mapcat #(expand-children % ent) children))
                                [{:parent (:block/title parent) :child (:block/title ent)}]))]
        ;; check pages only
        (is (= [{:parent "n1" :child "x"}
                {:parent "x" :child "z"}
                {:parent "x" :child "y"}]
               (take 3 (rest (expand-children (db-test/find-page-by-title @conn "n1") nil))))
            "First namespace tests duplicate parent page name")
        (is (= [{:parent "n2" :child "x"}
                {:parent "x" :child "z"}
                {:parent "n2" :child "alias"}]
               (rest (expand-children (db-test/find-page-by-title @conn "n2") nil)))
            "First namespace tests duplicate child page name and built-in page name")))

    (testing "journal timestamps"
      (is (= (date-time-util/journal-day->ms 20240207)
             (:block/created-at (db-test/find-page-by-title @conn "Feb 7th, 2024")))
          "journal pages are created on their journal day")
      (is (= (date-time-util/journal-day->ms 20240207)
             (:block/created-at (db-test/find-block-by-content @conn #"Inception")))
          "journal blocks are created on their page's journal day"))

    (testing "db attributes"
      (is (= true
             (:block/collapsed? (db-test/find-block-by-content @conn "collapsed block")))
          "Collapsed blocks are imported"))

    (testing "property :type changes"
      (is (= :node
             (:logseq.property/type (d/entity @conn :user.property/finishedat)))
          ":date property to :node value changes to :node")
      (is (= :node
             (:logseq.property/type (d/entity @conn :user.property/participants)))
          ":node property to :date value remains :node")

      (is (= :default
             (:logseq.property/type (d/entity @conn :user.property/description)))
          ":default property to :node (or any non :default value) remains :default")
      (is (= "[[Jakob]]"
             (:user.property/description (db-test/readable-properties (db-test/find-block-by-content @conn #":default to :node"))))
          ":default to :node property saves :default property value default with full text")

      (testing "with changes to upstream/existing property value"
        (is (= :default
               (:logseq.property/type (d/entity @conn :user.property/duration)))
            ":number property to :default value changes to :default")
        (is (= "20"
               (:user.property/duration (db-test/readable-properties (db-test/find-block-by-content @conn "existing :number to :default"))))
            "existing :number property value correctly saved as :default")
        (is (= :default
               (:logseq.property/type (d/entity @conn :user.property/people2)))
            ":node property changes to :default when :node is defined in same file")

        ;; tests :node :many to :default transition after :node is defined in separate file
        (is (= {:logseq.property/type :default :db/cardinality :db.cardinality/many}
               (select-keys (d/entity @conn :user.property/people) [:logseq.property/type :db/cardinality]))
            ":node property to :default value changes to :default and keeps existing cardinality")
        (is (= #{"[[Jakob]] [[Gabriel]]"}
               (:user.property/people (db-test/readable-properties (db-test/find-block-by-content @conn ":node people"))))
            "existing :node property value correctly saved as :default with full text")
        (is (= #{"[[Gabriel]] [[Jakob]]"}
               (:user.property/people (db-test/readable-properties (db-test/find-block-by-content @conn #"pending block for :node"))))
            "pending :node property value correctly saved as :default with full text")
        (is (some? (db-test/find-page-by-title @conn "Jakob"))
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
      (is (= "|markdown| table|\n|some|thing|" (:block/title (db-test/find-block-by-content @conn #"markdown.*table"))))
      (is (= "normal multiline block\na 2nd\nand a 3rd" (:block/title (db-test/find-block-by-content @conn #"normal multiline block"))))
      (is (= "colored multiline block\nlast line" (:block/title (db-test/find-block-by-content @conn #"colored multiline block"))))

      (let [block (db-test/find-block-by-content @conn #"multiline block with prop and deadline")]
        (is (= "multiline block with prop and deadline\nlast line" (:block/title block)))
        (is (= 20221126
               (-> (db-test/readable-properties block)
                   :logseq.property/deadline
                   date-time-util/ms->journal-day))
            "multiline block has correct journal as property value")
        (is (= "red"
               (-> (db-test/readable-properties block)
                   :logseq.property/background-color))
            "multiline block has correct background color as property value"))

      (let [block (db-test/find-block-by-content @conn #"multiline block with deadline and scheduled in 1 line and sth else")]
        (is (= "multiline block with deadline and scheduled in 1 line and sth else\nsomething else\nlast line" (:block/title block)))
        (is (= 20221126
               (-> (db-test/readable-properties block)
                   :logseq.property/deadline
                   date-time-util/ms->journal-day))
            "multiline block with deadline and scheduled has correct deadline journal as property value")
        (is (= 20221126
               (-> (db-test/readable-properties block)
                   :logseq.property/scheduled
                   date-time-util/ms->journal-day))
            "multiline block with deadline and scheduled has correct scheduled journal as property value"))

      (is (= "logbook block" (:block/title (db-test/find-block-by-content @conn #"^logbook block"))))
      (is (= "multiline logbook block\nlast line" (:block/title (db-test/find-block-by-content @conn #"multiline logbook block")))))

    (testing ":block/refs"
      (let [page (db-test/find-page-by-title @conn "chat-gpt")]
        (is (set/subset?
             #{"type" "LargeLanguageModel"}
             (->> page :block/refs (map #(:block/title (d/entity @conn (:db/id %)))) set))
            "Page has correct property and property value :block/refs"))

      (let [block (db-test/find-block-by-content @conn "old todo block")]
        (is (set/subset?
             #{:logseq.property/status :logseq.class/Task}
             (->> block
                  :block/refs
                  (map #(:db/ident (d/entity @conn (:db/id %))))
                  set))
            "Block has correct task tag and property :block/refs")))))

(deftest-async export-basic-graph-with-convert-all-tags-option-disabled
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          conn (db-test/create-conn)
          {:keys [import-state]}
          (import-file-graph-to-db file-graph-dir conn {:convert-all-tags? false})]

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")
    (is (= 0 (count @(:ignored-properties import-state))) "No ignored properties")
    (is (= 0 (->> @conn
                  (d/q '[:find [?ident ...]
                         :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                  count))
        "Correct number of user classes")

    (is (= 5 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Task]] @conn))))
    (is (= 4 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Query]] @conn))))
    (is (= 2 (count (d/q '[:find ?b :where [?b :block/tags :logseq.class/Card]] @conn))))

    (testing "replacing refs in :block/title when :remove-inline-tags? set"
      (is (= 2
             (->> (entity-plus/lookup-kv-then-entity
                   (db-test/find-block-by-content @conn #"replace with same start string")
                   :block/raw-title)
                  (re-seq db-content/id-ref-pattern)
                  distinct
                  count))
          "A block with ref names that start with same string has 2 distinct refs")

      (is (= 1
             (->> (entity-plus/lookup-kv-then-entity
                   (db-test/find-block-by-content @conn #"replace case insensitive")
                   :block/raw-title)
                  (re-seq db-content/id-ref-pattern)
                  distinct
                  count))
          "A block with different case of same ref names has 1 distinct ref"))

    (testing "tags convert to page, refs and page-tags"
      (let [block (db-test/find-block-by-content @conn #"Inception")
            tag-page (db-test/find-page-by-title @conn "Movie")
            tagged-page (db-test/find-page-by-title @conn "Interstellar")]
        (is (string/starts-with? (str (:block/title block)) "Inception [[")
            "tagged block tag converts tag to page ref")
        (is (= [(:db/id tag-page)] (map :db/id (:block/refs block)))
            "tagged block has correct refs")
        (is (and tag-page (not (ldb/class? tag-page)))
            "tag page is not a class")

        (is (= #{"Movie"}
               (:logseq.property/page-tags (db-test/readable-properties tagged-page)))
            "tagged page has existing page imported as a tag to page-tags")
        (is (= #{"LargeLanguageModel" "fun" "ai"}
               (:logseq.property/page-tags (db-test/readable-properties (db-test/find-page-by-title @conn "chat-gpt"))))
            "tagged page has new page and other pages marked with '#' and '[[]]` imported as tags to page-tags")))))

(deftest-async export-files-with-tag-classes-option
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_02_07.md" "pages/Interstellar.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:tag-classes ["movie"]})]
    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")

    (let [block (db-test/find-block-by-content @conn #"Inception")
          tag-page (db-test/find-page-by-title @conn "Movie")
          another-tag-page (db-test/find-page-by-title @conn "p0")]
      (is (= (:block/title block) "Inception")
          "tagged block with configured tag strips tag from content")
      (is (= [:user.class/Movie]
             (:block/tags (db-test/readable-properties block)))
          "tagged block has configured tag imported as a class")

      (is (= [:logseq.class/Tag] (mapv :db/ident (:block/tags tag-page)))
          "configured tag page in :tag-classes is a class")
      (is (and another-tag-page (not (ldb/class? another-tag-page)))
          "unconfigured tag page is not a class")

      (is (= {:block/tags [:logseq.class/Page :user.class/Movie]}
             (db-test/readable-properties (db-test/find-page-by-title @conn "Interstellar")))
          "tagged page has configured tag imported as a class"))))

(deftest-async export-files-with-property-classes-option
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %)
                      ["journals/2024_02_23.md" "pages/url.md" "pages/Whiteboard___Tool.md"
                       "pages/Whiteboard___Arrow_head_toggle.md"
                       "pages/Library.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:property-classes ["type"]})
          _ (@#'gp-exporter/export-class-properties conn conn)]

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
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

    (let [block (db-test/find-block-by-content @conn #"The Creator")
          tag-page (db-test/find-page-by-title @conn "Movie")]
      (is (= (:block/title block) "The Creator")
          "tagged block with configured tag strips tag from content")
      (is (= [:user.class/Movie]
             (:block/tags (db-test/readable-properties block)))
          "tagged block has configured tag imported as a class")
      (is (= (:user.property/testtagclass block) (:block/tags block))
          "tagged block can have another property that references the same class it is tagged with,
           without creating a duplicate class")

      (is (= [:logseq.class/Tag] (map :db/ident (:block/tags tag-page)))
          "configured tag page derived from :property-classes is a class")
      (is (nil? (db-test/find-page-by-title @conn "type"))
          "No page exists for configured property")

      (is (= #{:user.class/Property :logseq.class/Property}
             (set (:block/tags (db-test/readable-properties (db-test/find-page-by-title @conn "url")))))
          "tagged page has correct tags including one from option"))))

(deftest-async export-files-with-remove-inline-tags
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_02_07.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:remove-inline-tags? false :convert-all-tags? true})]

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")
    (is (string/starts-with? (:block/title (db-test/find-block-by-content @conn #"Inception"))
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
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_11_26.md"
                                                          "pages/CreativeWork.md" "pages/Movie.md" "pages/type.md"
                                                          "pages/Whiteboard___Tool.md" "pages/Whiteboard___Arrow_head_toggle.md"
                                                          "pages/Property.md" "pages/url.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:property-parent-classes ["parent"]
                                            ;; Also add this option to trigger some edge cases with namespace pages
                                            :property-classes ["type"]})]

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")

    (is (= #{:user.class/Movie :user.class/CreativeWork :user.class/Thing :user.class/Feature
             :user.class/Class :user.class/Tool :user.class/Whiteboard___Tool :user.class/Property}
           (->> @conn
                (d/q '[:find [?ident ...]
                       :where [?b :block/tags :logseq.class/Tag] [?b :db/ident ?ident] (not [?b :logseq.property/built-in?])])
                set))
        "All classes are correctly defined by :type")

    (is (= ["CreativeWork"] (map :block/title (:logseq.property.class/extends (d/entity @conn :user.class/Movie))))
        "Existing page correctly set as class parent")
    (is (= ["Thing"] (map :block/title (:logseq.property.class/extends (d/entity @conn :user.class/CreativeWork))))
        "New page correctly set as class parent")))

(deftest-async export-files-with-property-pages-disabled
  (p/let [file-graph-dir "test/resources/exporter-test-graph"
          ;; any page with properties
          files (mapv #(node-path/join file-graph-dir %) ["journals/2024_01_17.md"])
          conn (db-test/create-conn)
          _ (import-files-to-db files conn {:user-config {:property-pages/enabled? false
                                                          :property-pages/excludelist #{:prop-string}}})]

    (is (empty? (map :entity (:errors (db-validate/validate-local-db! @conn))))
        "Created graph has no validation errors")))

(deftest-async export-config-file-sets-title-format
  (p/let [conn (db-test/create-conn)
          read-file #(p/do! "{:journal/page-title-format \"yyyy-MM-dd\"}")
          _ (gp-exporter/export-config-file conn "logseq/config.edn" read-file {})]
    (is (= "yyyy-MM-dd"
           (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal)))
        "title format set correctly by config")))
