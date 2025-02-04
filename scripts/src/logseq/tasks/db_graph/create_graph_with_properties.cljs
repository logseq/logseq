(ns logseq.tasks.db-graph.create-graph-with-properties
  "Script that generates all the permutations of property types and cardinality.
   Also creates a page of queries that exercises most properties
   NOTE: This script is also used in CI to confirm graph creation works"
  (:require ["fs" :as fs]
            ["fs-extra$default" :as fse]
            ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.cli :as outliner-cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(defn- date-journal-title [date]
  (date-time-util/int->journal-title (date-time-util/date->int date) "MMM do, yyyy"))

(defn- subtract-days
  [date days]
  (new js/Date (- (.getTime date) (* days 24 60 60 1000))))

(defn- build-closed-values-config
  []
  {:default-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid)
                    :icon {:id % :type :emoji})
         ["joy" "sob" "upside_down_face"])
   :url-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid))
         ["https://logseq.com" "https://docs.logseq.com" "https://github.com/logseq/logseq"])
   :number-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid))
         [10 42 (rand 100)])})

(defn- query [query-string]
  {:block/title query-string
   :build/properties {:logseq.property/query query-string}
   :block/tags [{:db/ident :logseq.class/Query}]})

(defn- create-init-data
  []
  (let [today (new js/Date)
        yesterday (subtract-days today 1)
        [today-int yesterday-int] (map date-time-util/date->int [today yesterday])
        two-days-ago (subtract-days today 2)
        closed-values-config (build-closed-values-config)
        ;; Stores random closed values for use with queries
        closed-values (atom {})
        random-closed-value #(let [val (-> closed-values-config % rand-nth)]
                               (swap! closed-values assoc % val)
                               [:block/uuid (:uuid val)])
        object-uuid (random-uuid)
        get-closed-value #(:value (get @closed-values %))
        get-closed-value-ref #(vector :block/uuid (:uuid (get @closed-values %)))
        timestamp (common-util/time-ms)]
    {:pages-and-blocks
     (vec
      (concat
       ;; Page property values needs to be before b/c they are referenced by everything else
       [{:page {:block/title "Page 1"}}]

       ;; Objects
       [{:page {:block/title "Page object"
                :build/tags [:TestClass]}}
        {:page {:block/title "Blocks"}
         :blocks
         [{:block/title "block object"
           :block/uuid object-uuid
           :build/tags [:TestClass]}]}]

       ;; Journals
       [{:page
         {:build/journal today-int}
         :blocks
         [{:block/title "[[Block Properties]]"}
          {:block/title "[[Property Queries]]"}
          {:block/title "[[Has Property Queries]]"}]}
        {:page {:build/journal yesterday-int}}
        {:page {:build/journal (date-time-util/date->int two-days-ago)}}

        ;; Block property blocks and queries
        {:page {:block/title "Block Properties"}
         :blocks
         [{:block/title "default property block" :build/properties {:default "haha"}}
          {:block/title "default property block" :build/properties {:default-many #{"yee" "haw" "sir"}}}
          {:block/title "default-closed property block" :build/properties {:default-closed (random-closed-value :default-closed)}}
          {:block/title "url property block" :build/properties {:url "https://logseq.com"}}
          {:block/title "url-many property block" :build/properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}
          {:block/title "url-closed property block" :build/properties {:url-closed (random-closed-value :url-closed)}}
          {:block/title "checkbox property block" :build/properties {:checkbox true}}
          {:block/title "number property block" :build/properties {:number 5}}
          {:block/title "number-many property block" :build/properties {:number-many #{5 10}}}
          {:block/title "number-closed property block" :build/properties {:number-closed (random-closed-value :number-closed)}}
          {:block/title "node property block" :build/properties {:node [:block/uuid object-uuid]}}
          {:block/title "node without classes property block" :build/properties {:node-without-classes [:build/page {:block/title "Page 1"}]}}
          {:block/title "node-many property block" :build/properties {:node-many #{[:block/uuid object-uuid] [:build/page {:block/title "Page object"}]}}}
          {:block/title "date property block" :build/properties {:date [:build/page {:build/journal today-int}]}}
          {:block/title "date-many property block" :build/properties {:date-many #{[:build/page {:build/journal today-int}]
                                                                                   [:build/page {:build/journal yesterday-int}]}}}
          {:block/title "datetime property block" :build/properties {:datetime timestamp}}]}
        {:page {:block/title "Property Queries"}
         :blocks
         [(query "(property default \"haha\")")
          (query "(property default-many \"haw\")")
          (query (str "(property default-closed " (pr-str (get-closed-value :default-closed)) ")"))
          (query "(property url \"https://logseq.com\")")
          (query "(property url-many \"https://logseq.com\")")
          (query (str "(property url-closed " (pr-str (get-closed-value :url-closed)) ")"))
          (query "(property checkbox true)")
          (query "(property number 5)")
          (query "(property number-many 10)")
          (query (str "(property number-closed " (pr-str (get-closed-value :number-closed)) ")"))
          (query "(property node \"block object\")")
          (query "(property node-without-classes [[Page 1]])")
          (query "(property node-many [[Page object]])")
          (query (str "(property date " (page-ref/->page-ref (string/capitalize (date-journal-title today))) ")"))
          (query (str "(property date-many " (page-ref/->page-ref (string/capitalize (date-journal-title yesterday))) ")"))
          (query (str "(property datetime "  timestamp ")"))]}

        ;; Page property pages and queries
        {:page {:block/title "default page" :build/properties {:default "haha"}}}
        {:page {:block/title "default-many page" :build/properties {:default-many #{"yee" "haw" "sir"}}}}
        {:page {:block/title "default-closed page" :build/properties {:default-closed (get-closed-value-ref :default-closed)}}}
        {:page {:block/title "url page" :build/properties {:url "https://logseq.com"}}}
        {:page {:block/title "url-many page" :build/properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}}
        {:page {:block/title "url-closed page" :build/properties {:url-closed (get-closed-value-ref :url-closed)}}}
        {:page {:block/title "checkbox page" :build/properties {:checkbox true}}}
        {:page {:block/title "number page" :build/properties {:number 5}}}
        {:page {:block/title "number-many page" :build/properties {:number-many #{5 10}}}}
        {:page {:block/title "number-closed page" :build/properties {:number-closed (get-closed-value-ref :number-closed)}}}
        {:page {:block/title "node page" :build/properties {:node [:block/uuid object-uuid]}}}
        {:page {:block/title "node without classes page" :build/properties {:node-without-classes [:build/page {:block/title "Page 1"}]}}}
        {:page {:block/title "node-many page" :build/properties {:node-many #{[:block/uuid object-uuid] [:build/page {:block/title "Page object"}]}}}}
        {:page {:block/title "date page" :build/properties {:date [:build/page {:build/journal today-int}]}}}
        {:page {:block/title "date-many page" :build/properties {:date-many #{[:build/page {:build/journal today-int}]
                                                                              [:build/page {:build/journal yesterday-int}]}}}}
        {:page {:block/title "datetime page" :build/properties {:datetime timestamp}}}

        {:page {:block/title "Has Property Queries"}
         :blocks
         [(query "(property default)")
          (query "(property default-many)")
          (query "(property default-closed)")
          (query "(property url)")
          (query "(property url-many)")
          (query "(property url-closed)")
          (query "(property checkbox)")
          (query "(property number)")
          (query "(property number-many)")
          (query "(property number-closed)")
          (query "(property node)")
          (query "(property node-without-classes)")
          (query "(property node-many)")
          (query "(property date)")
          (query "(property date-many)")
          (query "(property datetime)")]}]))

     :classes {:TestClass {}}

     ;; Properties
     :properties
     (->> db-property-type/user-built-in-property-types
          (mapcat #(cond-> (if (= :node %)
                             [[% {:logseq.property/type % :build/property-classes [:TestClass]}]
                              [:node-without-classes {:logseq.property/type %}]]
                             [[% {:logseq.property/type %}]])
                     (contains? db-property-type/cardinality-property-types %)
                     (conj [(keyword (str (name %) "-many"))
                            (cond-> {:logseq.property/type %
                                     :db/cardinality :many}
                              (= :node %)
                              (assoc :build/property-classes [:TestClass]))])))
          (into (mapv #(vector (keyword (str (name %) "-closed"))
                               {:logseq.property/type %
                                :build/closed-values (closed-values-config (keyword (str (name %) "-closed")))})
                      [:default :url :number]))
          (into {}))}))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :config {:alias :c
            :coerce edn/read-string
            :desc "EDN map to add to config.edn"}})

(defn -main [args]
  (let [graph-dir (first args)
        options (cli/parse-opts args {:spec spec})
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        db-path (node-path/join dir db-name "db.sqlite")
        _ (when (fs/existsSync db-path)
            (fse/removeSync db-path))
        conn (outliner-cli/init-conn dir db-name {:additional-config (:config options)
                                                  :classpath (cp/get-classpath)})
        {:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx (create-init-data))
        existing-names (set (map :v (d/datoms @conn :avet :block/title)))
        conflicting-names (set/intersection existing-names (set (keep :block/title init-tx)))]
    (when (seq conflicting-names)
      (println "Error: Following names conflict -" (string/join "," conflicting-names))
      (js/process.exit 1))
    (println "DB dir: " (node-path/join dir db-name))
    (println "Generating" (count (filter :block/name init-tx)) "pages and"
             (count (filter :block/title init-tx)) "blocks ...")
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (println "Created graph" (str db-name " with " (count (d/datoms @conn :eavt)) " datoms!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
