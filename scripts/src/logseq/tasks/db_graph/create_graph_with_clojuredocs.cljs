(ns logseq.tasks.db-graph.create-graph-with-clojuredocs
  "Script that convert clojuredocs-export.json into logseq graph data."
  (:require ["fs" :as fs]
            [babashka.cli :as cli]
            [cljs.pprint :as pp]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.outliner.cli :as outliner-cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :config {:alias :c
            :coerce edn/read-string
            :desc "EDN map to add to config.edn"}
   :export {:alias :e
            :desc "Exports graph to clojuredocs.edn"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

(defn example=>block
  [example]
  (when-let [body (:body example)]
    {:block/title body
     :build/tags [:logseq.class/Code-block]
     :build/properties {:logseq.property.node/display-type :code
                        :logseq.property.code/lang "Clojure"}}))

(defn convert-var-to-page
  [type->block-uuid {:keys [ns name type see-alsos examples notes arglists doc library-url] :as _clj-var}]
  {:page
   {:build/properties
    {:user.property/library-url-ip8W5T7M library-url
     :user.property/type-Un-Aypix
     [:block/uuid (type->block-uuid type)]},
    :block/title (str "`" name "` (" ns ")")}
   :blocks
   [{:block/title "Doc",
     :build/properties {:logseq.property/heading 3},
     :build/children
     (mapv
      (fn [line]
        {:block/title line
         :build/properties {}})
      (string/split-lines doc))}
    {:block/title "Examples",
     :build/properties {:logseq.property/heading 3},
     :build/children
     (vec (keep example=>block examples))}
    {:block/title "Notes",
     :build/properties {:logseq.property/heading 3}
     :build/children
     (mapv
      (fn [note]
        (let [body (or (:body note) "")
              author (or (:login (:author note)) "???")]
          {:block/title author
           :build/children
           [{:block/title body
             :build/tags [:logseq.class/Quote-block]
             :build/properties {:logseq.property.node/display-type :quote}}]}))
      notes)}
    {:block/title "Arglists",
     :build/properties {:logseq.property/heading 3}
     :build/children
     (vec
      (when-let [arglists-content (with-out-str (pp/pprint arglists))]
        [{:block/title arglists-content
          :build/tags [:logseq.class/Code-block]
          :build/properties {:logseq.property.node/display-type :code
                             :logseq.property.code/lang "Clojure"}}]))}]})

(defn convert-type-pages
  "return {:pages ..., :type->block-uuid ...}"
  [clj-vars]
  (let [all-types (set (map :type clj-vars))
        type->block-uuid
        (into {} (map (fn [tp] [tp (random-uuid)])) all-types)
        pages
        (map
         (fn [[tp block-uuid]]
           {:page
            {:block/uuid block-uuid
             :build/keep-uuid? true
             :build/properties {},
             :block/title tp},
            :blocks
            []})
         type->block-uuid)]
    {:pages pages :type->block-uuid type->block-uuid}))

(def properties
  {:user.property/type-Un-Aypix
   {:logseq.property/type :node,
    :build/properties {},
    :block/collapsed? false,
    :block/title "type",
    :db/cardinality :db.cardinality/one},
   :user.property/library-url-ip8W5T7M
   {:db/cardinality :db.cardinality/one,
    :logseq.property/type :url,
    :block/title "library-url",
    :build/properties {}}})

(defn convert
  [clj-vars]
  (let [{type-pages :pages type->block-uuid :type->block-uuid} (convert-type-pages clj-vars)]
    {:properties properties
     :classes {}
     :pages-and-blocks
     (vec
      (concat
       type-pages
       (map (partial convert-var-to-page type->block-uuid) clj-vars)))}))

(comment
  (def clojuredocs-json (js->clj (js/JSON.parse (fs/readFileSync "resources/clojuredocs-export.json"))
                                 :keywordize-keys true))
  (def result (convert (filter #(= "clojure.core" (:ns %)) (:vars clojuredocs-json))))
  (fs/writeFileSync "cljdocs.edn" (with-out-str (pp/pprint result))))

(defn -main [args]
  (let [[graph-dir] args
        options (cli/parse-opts args {:spec spec})
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        init-conn-args (sqlite-cli/->open-db-args graph-dir)
        db-name (if (= 1 (count init-conn-args)) (first init-conn-args) (second init-conn-args))
        conn (apply outliner-cli/init-conn
                    (conj init-conn-args {:additional-config (:config options)
                                          :classpath (cp/get-classpath)}))
        clojuredocs-json (js->clj (js/JSON.parse (fs/readFileSync "resources/clojuredocs-export.json"))
                                  :keywordize-keys true)
        clj-vars (:vars clojuredocs-json)
        result-edn (convert clj-vars)]
    (println "Generating" (count (:pages-and-blocks result-edn)) "pages")
    (if (:export options)
      (do (println "Generating clojuredocs.edn ...")
          (fs/writeFileSync "clojuredocs.edn" (with-out-str (pp/pprint result-edn))))
      (do (println "Transacting to graph ...")
          (let [{:keys [init-tx block-props-tx]} (outliner-cli/build-blocks-tx result-edn)]
            (d/transact! conn init-tx)
            (d/transact! conn block-props-tx)
            (println "Transacted" (count (d/datoms @conn :eavt)) "datoms")
            (println "Created graph " (str "'" db-name "'") "!"))))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
