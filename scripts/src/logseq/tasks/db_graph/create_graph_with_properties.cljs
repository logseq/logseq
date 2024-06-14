(ns logseq.tasks.db-graph.create-graph-with-properties
  "Script that generates all the permutations of property types and cardinality.
   Also creates a page of queries that exercises most properties
   NOTE: This script is also used in CI to confirm graph creation works"
  (:require [logseq.outliner.cli :as outliner-cli]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property.type :as db-property-type]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [datascript.core :as d]
            ["path" :as node-path]
            ["os" :as os]
            [babashka.cli :as cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(defn- date-journal-title [date]
  (date-time-util/int->journal-title (date-time-util/date->int date) "MMM do, yyyy"))

(defn- subtract-days
  [date days]
  (new js/Date (- (.getTime date) (* days 24 60 60 1000))))

(defn- build-closed-values-config
  [_opts]
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
         [10 42 (rand 100)])
   :page-closed
   (mapv #(hash-map :value %
                    :uuid (random-uuid))
         ["Page 1" "Page 2" "Page 3"])
   ;; If this is enabled again, :uuid translation support would need to be added for :build/closed-values
   :date-closed
   {}})

(defn- create-init-data
  []
  (let [today (new js/Date)
        yesterday (subtract-days today 1)
        two-days-ago (subtract-days today 2)
        closed-values-config (build-closed-values-config {:dates [today yesterday two-days-ago]})
        page-values-tx (mapv #(hash-map :page
                                        {:block/uuid (:uuid %) :block/original-name (:value %)})
                             (:page-closed closed-values-config))
        ;; Stores random closed values for use with queries
        closed-values (atom {})
        random-closed-value #(let [val (-> closed-values-config % rand-nth)]
                               (swap! closed-values assoc % (:value val))
                               [:block/uuid (:uuid val)])
        get-closed-value #(get @closed-values %)]
    {:pages-and-blocks
     (into
      ;; Page property values needs to be before b/c they are referenced by everything else
      page-values-tx
      ;; Journals
      [{:page
        {:build/journal (date-time-util/date->int today)}
        :blocks
        [{:block/content "[[Block Properties]]"}
         {:block/content "[[Block Property Queries]]"}
         {:block/content "[[Page Property Queries]]"}]}
       {:page {:build/journal (date-time-util/date->int yesterday)}}
       {:page {:build/journal (date-time-util/date->int two-days-ago)}}

       ;; Block property blocks and queries
       {:page {:block/original-name "Block Properties"}
        :blocks
        [{:block/content "default property block" :build/properties {:default "haha"}}
         {:block/content "default property block" :build/properties {:default-many #{"yee" "haw" "sir"}}}
         {:block/content "default-closed property block" :build/properties {:default-closed (random-closed-value :default-closed)}}
         {:block/content "url property block" :build/properties {:url "https://logseq.com"}}
         {:block/content "url-many property block" :build/properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}
         {:block/content "url-closed property block" :build/properties {:url-closed (random-closed-value :url-closed)}}
         {:block/content "checkbox property block" :build/properties {:checkbox true}}
         {:block/content "number property block" :build/properties {:number 5}}
         {:block/content "number-many property block" :build/properties {:number-many #{5 10}}}
         {:block/content "number-closed property block" :build/properties {:number-closed (random-closed-value :number-closed)}}
         {:block/content "page property block" :build/properties {:page [:page "Page 1"]}}
         {:block/content "page-many property block" :build/properties {:page-many #{[:page "Page 1"] [:page "Page 2"]}}}
        ;;  ;; :page-closed and :date-closed disabled for now since they're not supported
        ;;  #_{:block/content "page-closed property block" :build/properties {:page-closed (random-closed-value :page-closed)}}
         {:block/content "date property block" :build/properties {:date [:page (date-journal-title today)]}}
         {:block/content "date-many property block" :build/properties {:date-many #{[:page (date-journal-title today)]
                                                                                    [:page (date-journal-title yesterday)]}}}
         #_{:block/content "date-closed property block" :build/properties {:date-closed (random-closed-value :date-closed)}}]}
       {:page {:block/original-name "Block Property Queries"}
        :blocks
        [{:block/content "{{query (property :default \"haha\")}}"}
         {:block/content "{{query (property :default-many \"haw\")}}"}
         {:block/content (str "{{query (property :default-closed " (pr-str (get-closed-value :default-closed)) ")}}")}
         {:block/content "{{query (property :url \"https://logseq.com\")}}"}
         {:block/content "{{query (property :url-many \"https://logseq.com\")}}"}
         {:block/content (str "{{query (property :url-closed " (pr-str (get-closed-value :url-closed)) ")}}")}
         {:block/content "{{query (property :checkbox true)}}"}
         {:block/content "{{query (property :number 5)}}"}
         {:block/content "{{query (property :number-many 10)}}"}
         {:block/content (str "{{query (property :number-closed " (pr-str (get-closed-value :number-closed)) ")}}")}
         {:block/content "{{query (property :page [[Page 1]])}}"}
         {:block/content "{{query (property :page-many [[Page 2]])}}"}
         #_{:block/content (str "{{query (property :page-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :page-closed))) ")}}")}
         {:block/content (str "{{query (property :date " (page-ref/->page-ref (string/capitalize (date-journal-title today))) ")}}")}
         {:block/content (str "{{query (property :date-many " (page-ref/->page-ref (string/capitalize (date-journal-title yesterday))) ")}}")}
         #_{:block/content (str "{{query (property :date-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :date-closed))) ")}}")}]}

       ;; Page property pages and queries
       {:page {:block/original-name "default page" :build/properties {:default "yolo"}}}
       {:page {:block/original-name "default-many page" :build/properties {:default-many #{"yee" "haw" "sir"}}}}
       {:page {:block/original-name "default-closed page" :build/properties {:default-closed (random-closed-value :default-closed)}}}
       {:page {:block/original-name "url page" :build/properties {:url "https://logseq.com"}}}
       {:page {:block/original-name "url-many page" :build/properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}}
       {:page {:block/original-name "url-closed page" :build/properties {:url-closed (random-closed-value :url-closed)}}}
       {:page {:block/original-name "checkbox page" :build/properties {:checkbox true}}}
       {:page {:block/original-name "number page" :build/properties {:number 5}}}
       {:page {:block/original-name "number-many page" :build/properties {:number-many #{5 10}}}}
       {:page {:block/original-name "number-closed page" :build/properties {:number-closed (random-closed-value :number-closed)}}}
       {:page {:block/original-name "page page" :build/properties {:page [:page "Page 1"]}}}
       {:page {:block/original-name "page-many page" :build/properties {:page-many #{[:page "Page 1"] [:page "Page 2"]}}}}
      ;;  #_{:page {:block/original-name "page-closed page" :build/properties {:page-closed (random-closed-value :page-closed)}}}
       {:page {:block/original-name "date page" :build/properties {:date [:page (date-journal-title today)]}}}
       {:page {:block/original-name "date-many page" :build/properties {:date-many #{[:page (date-journal-title today)]
                                                                                     [:page (date-journal-title yesterday)]}}}}
       #_{:page {:block/original-name "date-closed page" :build/properties {:date-closed (random-closed-value :date-closed)}}}
       {:page {:block/original-name "Page Property Queries"}
        :blocks
        [{:block/content "{{query (page-property :default \"yolo\")}}"}
         {:block/content "{{query (page-property :default-many \"haw\")}}"}
         {:block/content (str "{{query (page-property :default-closed " (pr-str (get-closed-value :default-closed)) ")}}")}
         {:block/content "{{query (page-property :url \"https://logseq.com\")}}"}
         {:block/content "{{query (page-property :url-many \"https://logseq.com\")}}"}
         {:block/content (str "{{query (page-property :url-closed " (pr-str (get-closed-value :url-closed)) ")}}")}
         {:block/content "{{query (page-property :checkbox true)}}"}
         {:block/content "{{query (page-property :number 5)}}"}
         {:block/content "{{query (page-property :number-many 10)}}"}
         {:block/content (str "{{query (page-property :number-closed " (pr-str (get-closed-value :number-closed)) ")}}")}
         {:block/content "{{query (page-property :page [[Page 1]])}}"}
         {:block/content "{{query (page-property :page-many [[Page 2]])}}"}
         #_{:block/content (str "{{query (page-property :page-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :page-closed))) ")}}")}
         {:block/content (str "{{query (page-property :date " (page-ref/->page-ref (string/capitalize (date-journal-title today))) ")}}")}
         {:block/content (str "{{query (page-property :date-many " (page-ref/->page-ref (string/capitalize (date-journal-title yesterday))) ")}}")}
         #_{:block/content (str "{{query (page-property :date-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :date-closed))) ")}}")}]}])

     ;; Properties
     :properties
     (->> [:default :url :checkbox :number :page :date]
          (mapcat #(cond-> [[% {:block/schema {:type %}}]]
                     (db-property-type/property-type-allows-schema-attribute? % :cardinality)
                     (conj [(keyword (str (name %) "-many")) {:block/schema {:type % :cardinality :many}}])))
          (into (mapv #(vector (keyword (str (name %) "-closed"))
                               {:block/schema {:type %}
                                :build/closed-values (closed-values-config (keyword (str (name %) "-closed")))})
                      [:default :url :number #_:page #_:date]))
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
        conn (outliner-cli/init-conn dir db-name {:additional-config (:config options)
                                                  :classpath (cp/get-classpath)})
        {:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx (create-init-data))
        existing-names (set (map :v (d/datoms @conn :avet :block/original-name)))
        conflicting-names (set/intersection existing-names (set (keep :block/original-name init-tx)))]
    (when (seq conflicting-names)
      (println "Error: Following names conflict -" (string/join "," conflicting-names))
      (js/process.exit 1))
    (println "DB dir: " (node-path/join dir db-name))
    (println "Generating" (count (filter :block/name init-tx)) "pages and"
             (count (filter :block/content init-tx)) "blocks ...")
    (d/transact! conn init-tx)
    (d/transact! conn block-props-tx)
    (println "Created graph" (str db-name " with " (count (d/datoms @conn :eavt)) " datoms!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
