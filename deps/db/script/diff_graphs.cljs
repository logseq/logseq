(ns diff-graphs
  "A script that diffs two DB graphs through their sqlite.build EDN"
  (:require ["os" :as os]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.data :as data]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [logseq.common.config :as common-config]
            #_:clj-kondo/ignore
            [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [nbb.core :as nbb]))

(defn- get-dir-and-db-name
  "Gets dir and db name for use with open-db!"
  [graph-dir]
  (if (string/includes? graph-dir "/")
    (let [graph-dir'
          (node-path/join (or js/process.env.ORIGINAL_PWD ".") graph-dir)]
      ((juxt node-path/dirname node-path/basename) graph-dir'))
    [(node-path/join (os/homedir) "logseq" "graphs") graph-dir]))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :exclude-namespaces {:alias :e
                        :coerce #{}
                        :desc "Namespaces to exclude from properties and classes"}
   :exclude-built-in-pages? {:alias :b
                             :desc "Exclude built-in pages"}
   :include-timestamps? {:alias :t
                         :desc "Include timestamps in export"}})

(defn -main [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        [graph-dir graph-dir2] args'
        _ (when (or (nil? graph-dir) (nil? graph-dir2) (:help options))
            (println (str "Usage: $0 GRAPH-NAME GRAPH-NAME2 [& ARGS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        conn (apply sqlite-cli/open-db! (get-dir-and-db-name graph-dir))
        conn2 (apply sqlite-cli/open-db! (get-dir-and-db-name graph-dir2))
        export-options (select-keys options [:include-timestamps? :exclude-namespaces :exclude-built-in-pages?])
        export-map (sqlite-export/build-export @conn {:export-type :graph :graph-options export-options})
        export-map2 (sqlite-export/build-export @conn2 {:export-type :graph :graph-options export-options})
        prepare-export-to-diff
        (fn [m]
          (-> m
              (update :classes update-vals (fn [m]
                                             (update m :build/class-properties sort)))
              ;; TODO: fix built-in views for schema export
              (update :pages-and-blocks (fn [pbs]
                                          (vec (remove #(= (:block/title (:page %)) common-config/views-page-name) pbs))))))
        diff (->> (data/diff (prepare-export-to-diff export-map) (prepare-export-to-diff export-map2))
                  butlast)]
    (if (= diff [nil nil])
      (println "The two graphs are equal!")
      (do (pprint/pprint diff)
          (js/process.exit 1)))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
