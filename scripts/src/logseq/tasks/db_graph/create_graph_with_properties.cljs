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
   ;; If this is enabled again, :uuid translation support would need to be added for :build/closed-values
   :date-closed
   {}})

(defn- create-init-data
  []
  (let [today (new js/Date)
        yesterday (subtract-days today 1)
        two-days-ago (subtract-days today 2)
        closed-values-config (build-closed-values-config {:dates [today yesterday two-days-ago]})
        ;; Stores random closed values for use with queries
        closed-values (atom {})
        random-closed-value #(let [val (-> closed-values-config % rand-nth)]
                               (swap! closed-values assoc % (:value val))
                               [:block/uuid (:uuid val)])
        object-uuid (random-uuid)
        get-closed-value #(get @closed-values %)]
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
         {:build/journal (date-time-util/date->int today)}
         :blocks
         [{:block/title "[[Block Properties]]"}
          {:block/title "[[Block Property Queries]]"}
          {:block/title "[[Page Property Queries]]"}]}
        {:page {:build/journal (date-time-util/date->int yesterday)}}
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
          {:block/title "node without classes property block" :build/properties {:node-without-classes [:page "Page 1"]}}
          {:block/title "node-many property block" :build/properties {:node-many #{[:block/uuid object-uuid] [:page "Page object"]}}}
          ;;  ;; :date-closed disabled for now since they're not supported
          {:block/title "date property block" :build/properties {:date [:page (date-journal-title today)]}}
          {:block/title "date-many property block" :build/properties {:date-many #{[:page (date-journal-title today)]
                                                                                   [:page (date-journal-title yesterday)]}}}
          #_{:block/title "date-closed property block" :build/properties {:date-closed (random-closed-value :date-closed)}}]}
        {:page {:block/title "Block Property Queries"}
         :blocks
         [{:block/title "{{query (property :default \"haha\")}}"}
          {:block/title "{{query (property :default-many \"haw\")}}"}
          {:block/title (str "{{query (property :default-closed " (pr-str (get-closed-value :default-closed)) ")}}")}
          {:block/title "{{query (property :url \"https://logseq.com\")}}"}
          {:block/title "{{query (property :url-many \"https://logseq.com\")}}"}
          {:block/title (str "{{query (property :url-closed " (pr-str (get-closed-value :url-closed)) ")}}")}
          {:block/title "{{query (property :checkbox true)}}"}
          {:block/title "{{query (property :number 5)}}"}
          {:block/title "{{query (property :number-many 10)}}"}
          {:block/title (str "{{query (property :number-closed " (pr-str (get-closed-value :number-closed)) ")}}")}
          {:block/title "{{query (property :node \"block object\")}}"}
          {:block/title "{{query (property :node-without-classes [[Page 1]])}}"}
          {:block/title "{{query (property :node-many [[Page object]])}}"}
          {:block/title (str "{{query (property :date " (page-ref/->page-ref (string/capitalize (date-journal-title today))) ")}}")}
          {:block/title (str "{{query (property :date-many " (page-ref/->page-ref (string/capitalize (date-journal-title yesterday))) ")}}")}
          #_{:block/title (str "{{query (property :date-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :date-closed))) ")}}")}]}

        ;; Page property pages and queries
        {:page {:block/title "default page" :build/properties {:default "yolo"}}}
        {:page {:block/title "default-many page" :build/properties {:default-many #{"yee" "haw" "sir"}}}}
        {:page {:block/title "default-closed page" :build/properties {:default-closed (random-closed-value :default-closed)}}}
        {:page {:block/title "url page" :build/properties {:url "https://logseq.com"}}}
        {:page {:block/title "url-many page" :build/properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}}
        {:page {:block/title "url-closed page" :build/properties {:url-closed (random-closed-value :url-closed)}}}
        {:page {:block/title "checkbox page" :build/properties {:checkbox true}}}
        {:page {:block/title "number page" :build/properties {:number 5}}}
        {:page {:block/title "number-many page" :build/properties {:number-many #{5 10}}}}
        {:page {:block/title "number-closed page" :build/properties {:number-closed (random-closed-value :number-closed)}}}
        {:page {:block/title "node page" :build/properties {:node [:block/uuid object-uuid]}}}
        {:page {:block/title "node without classes page" :build/properties {:node-without-classes [:page "Page 1"]}}}
        {:page {:block/title "node-many page" :build/properties {:node-many #{[:block/uuid object-uuid] [:page "Page object"]}}}}
        {:page {:block/title "date page" :build/properties {:date [:page (date-journal-title today)]}}}
        {:page {:block/title "date-many page" :build/properties {:date-many #{[:page (date-journal-title today)]
                                                                              [:page (date-journal-title yesterday)]}}}}
        #_{:page {:block/title "date-closed page" :build/properties {:date-closed (random-closed-value :date-closed)}}}
        {:page {:block/title "Page Property Queries"}
         :blocks
         [{:block/title "{{query (page-property :default \"yolo\")}}"}
          {:block/title "{{query (page-property :default-many \"haw\")}}"}
          {:block/title (str "{{query (page-property :default-closed " (pr-str (get-closed-value :default-closed)) ")}}")}
          {:block/title "{{query (page-property :url \"https://logseq.com\")}}"}
          {:block/title "{{query (page-property :url-many \"https://logseq.com\")}}"}
          {:block/title (str "{{query (page-property :url-closed " (pr-str (get-closed-value :url-closed)) ")}}")}
          {:block/title "{{query (page-property :checkbox true)}}"}
          {:block/title "{{query (page-property :number 5)}}"}
          {:block/title "{{query (page-property :number-many 10)}}"}
          {:block/title (str "{{query (page-property :number-closed " (pr-str (get-closed-value :number-closed)) ")}}")}
          {:block/title "{{query (page-property :node \"block object\")}}"}
          {:block/title "{{query (page-property :node-without-classes [[Page 1]])}}"}
          {:block/title "{{query (page-property :node-many [[Page object]])}}"}
          {:block/title (str "{{query (page-property :date " (page-ref/->page-ref (string/capitalize (date-journal-title today))) ")}}")}
          {:block/title (str "{{query (page-property :date-many " (page-ref/->page-ref (string/capitalize (date-journal-title yesterday))) ")}}")}
          #_{:block/title (str "{{query (page-property :date-closed " (page-ref/->page-ref (string/capitalize (get-closed-value :date-closed))) ")}}")}]}]))

     :classes {:TestClass {}}

     ;; Properties
     :properties
     (->> db-property-type/user-built-in-property-types
          (mapcat #(cond-> (if (= :node %)
                             [[% {:block/schema {:type %} :build/schema-classes [:TestClass]}]
                              [:node-without-classes {:block/schema {:type %}}]]
                             [[% {:block/schema {:type %}}]])
                     (db-property-type/property-type-allows-schema-attribute? % :cardinality)
                     (conj [(keyword (str (name %) "-many"))
                            (cond-> {:block/schema {:type % :cardinality :many}}
                              (= :node %)
                              (assoc :build/schema-classes [:TestClass]))])))
          (into (mapv #(vector (keyword (str (name %) "-closed"))
                               {:block/schema {:type %}
                                :build/closed-values (closed-values-config (keyword (str (name %) "-closed")))})
                      [:default :url :number #_:date]))
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
