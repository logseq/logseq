(ns logseq.tasks.db-graph.create-graph-with-large-sizes
  "Script that generates graphs at large sizes"
  (:require [logseq.tasks.db-graph.create-graph :as create-graph]
            [clojure.string :as string]
            [datascript.core :as d]
            [babashka.cli :as cli]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.core :as nbb]))

(def *ids (atom #{}))
(defn get-next-id
  []
  (let [id (random-uuid)]
    (if (@*ids id)
      (get-next-id)
      (do
        (swap! *ids conj id)
        id))))

(defn build-pages
  [start-idx n]
  (let [ids (repeatedly n get-next-id)]
    (map-indexed
     (fn [idx id]
       {:block/uuid id
        :block/name (str "page-" (+ start-idx idx))})
     ids)))

(defn build-blocks
  [size]
  (vec (repeatedly size
                   (fn []
                     (let [id (get-next-id)]
                       {:block/uuid id
                        :block/content (str id)})))))

(defn- create-init-data
  [options]
  (let [pages (build-pages 0 (:pages options))]
    {:pages-and-blocks
     (mapv #(hash-map :page % :blocks (build-blocks (:blocks options)))
           pages)}))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :pages {:alias :p
           :default 1000
           :desc "Number of pages to create"}
   :blocks {:alias :b
            :default 20
            :desc "Number of blocks to create"}})

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
        conn (create-graph/init-conn dir db-name)
        _ (println "Building tx ...")
        blocks-tx (create-graph/create-blocks-tx (create-init-data options))]
    (println "Built" (count blocks-tx) "tx," (count (filter :block/name blocks-tx)) "pages and"
             (count (filter :block/content blocks-tx)) "blocks ...")
    ;; Vary the chunking with page size for now
    (let [tx-chunks (partition-all (:pages options) blocks-tx)]
      (loop [chunks tx-chunks
             chunk-num 1]
        (when-let [chunk (first chunks)]
          (println "Transacting chunk" chunk-num  "of" (count tx-chunks)
                   "starting with block:" (pr-str (select-keys (first chunk) [:block/content :block/name])))
          (d/transact! conn chunk)
          (recur (rest chunks) (inc chunk-num)))))
    #_(d/transact! conn blocks-tx)
    (println "Created graph" (str db-name " with " (count (d/datoms @conn :eavt)) " datoms!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))