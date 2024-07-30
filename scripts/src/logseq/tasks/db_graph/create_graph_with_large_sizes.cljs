(ns logseq.tasks.db-graph.create-graph-with-large-sizes
  "Script that generates graphs at large sizes"
  (:require [logseq.outliner.cli :as outliner-cli]
            [clojure.string :as string]
            [datascript.core :as d]
            [babashka.cli :as cli]
            ["path" :as node-path]
            ["os" :as os]
            [nbb.classpath :as cp]
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
        :block/title (str "Page-" (+ start-idx idx))})
     ids)))

(defn build-blocks
  [size]
  (vec (repeatedly size
                   (fn []
                     (let [id (get-next-id)]
                       {:block/uuid id
                        :block/title (str id)})))))

(defn- create-init-data
  [options]
  (let [pages (build-pages 0 (:pages options))]
    {:pages-and-blocks
     (mapv #(hash-map :page % :blocks (build-blocks (:blocks options)))
           pages)
     ;; Custom id fn because transaction chunks may separate blocks and pages from each other
     :page-id-fn (fn [b] [:block/uuid (:block/uuid b)])}))

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
        conn (outliner-cli/init-conn dir db-name {:classpath (cp/get-classpath)})
        _ (println "Building tx ...")
        {:keys [init-tx]} (outliner-cli/build-blocks-tx (create-init-data options))]
    (println "Built" (count init-tx) "tx," (count (filter :block/title init-tx)) "pages and"
             (count (filter :block/title init-tx)) "blocks ...")
    ;; Vary the chunking with page size up to a max to avoid OOM
    (let [tx-chunks (partition-all (min (:pages options) 30000) init-tx)]
      (loop [chunks tx-chunks
             chunk-num 1]
        (when-let [chunk (first chunks)]
          (println "Transacting chunk" chunk-num  "of" (count tx-chunks)
                   "starting with block:" (pr-str (select-keys (first chunk) [:block/title :block/title])))
          (d/transact! conn chunk)
          (recur (rest chunks) (inc chunk-num)))))
    #_(d/transact! conn blocks-tx)
    (println "Created graph" (str db-name " with " (count (d/datoms @conn :eavt)) " datoms!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))
