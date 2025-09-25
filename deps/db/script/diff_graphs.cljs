(ns diff-graphs
  "A script that diffs two DB graphs through their sqlite.build EDN"
  (:require [babashka.cli :as cli]
            [clojure.data :as data]
            [clojure.pprint :as pprint]
            [logseq.common.config :as common-config]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.export :as sqlite-export]
            [nbb.core :as nbb]))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :exclude-namespaces {:alias :e
                        :coerce #{}
                        :desc "Namespaces to exclude from properties and classes"}
   :exclude-built-in-pages? {:alias :b
                             :desc "Exclude built-in pages"}
   :set-diff {:alias :s
              :desc "Use set to reduce noisy diff caused by ordering"}
   :include-timestamps? {:alias :T
                         :desc "Include timestamps in export"}
   :export-type {:alias :t
                 :coerce :keyword
                 :desc "Export type"
                 :default :graph}})

(defn -main [args]
  (let [{options :opts args' :args} (cli/parse-args args {:spec spec})
        [graph-dir graph-dir2] args'
        _ (when (or (nil? graph-dir) (nil? graph-dir2) (:help options))
            (println (str "Usage: $0 GRAPH-NAME GRAPH-NAME2 [& ARGS] [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        conn (apply sqlite-cli/open-db! (sqlite-cli/->open-db-args graph-dir))
        conn2 (apply sqlite-cli/open-db! (sqlite-cli/->open-db-args graph-dir2))
        export-args (cond-> {:export-type (:export-type options)}
                      (= :graph (:export-type options))
                      (assoc :graph-options (select-keys options [:include-timestamps? :exclude-namespaces :exclude-built-in-pages?])))
        export-map (sqlite-export/build-export @conn export-args)
        export-map2 (sqlite-export/build-export @conn2 export-args)
        prepare-export-to-diff
        (fn [m]
          (cond->
           (-> m
               ;; TODO: Fix order of these build keys
               (update :classes update-vals (fn [m] (update m :build/class-properties sort)))
               (update :properties update-vals (fn [m] (update m :build/property-classes sort)))
               (update ::sqlite-export/kv-values
                       (fn [kvs]
                         ;; Ignore extra metadata that a copied graph can add
                         (vec (remove #(#{:logseq.kv/import-type :logseq.kv/imported-at} (:db/ident %)) kvs))))
              ;; TODO: fix built-in views for schema export
               (update :pages-and-blocks (fn [pbs]
                                           (vec (remove #(= (:block/title (:page %)) common-config/views-page-name) pbs)))))
            (:set-diff options)
            (update-vals set)))
        diff (->> (data/diff (prepare-export-to-diff export-map) (prepare-export-to-diff export-map2))
                  butlast)]
    (if (= diff [nil nil])
      (println "The two graphs are equal!")
      (do (pprint/pprint diff)
          (js/process.exit 1)))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
