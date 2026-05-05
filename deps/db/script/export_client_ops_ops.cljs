(ns export-client-ops-ops
  "Export client-ops tx entities to an EDN file sorted by :db-sync/created-at asc.

  Examples:
  $ pnpm exec nbb-logseq script/export_client_ops_ops.cljs /path/to/client-ops.sqlite
  $ pnpm exec nbb-logseq script/export_client_ops_ops.cljs /path/to/client-ops.sqlite --out client-ops-ops.edn"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.pprint :as pprint]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [nbb.core :as nbb]))

(def spec
  {:help {:alias :h
          :desc "Show help"}
   :out {:alias :o
         :desc "Output EDN file path"
         :coerce :string}})

(def op-keys
  [:db-sync/tx-id
   :db-sync/created-at
   :db-sync/pending?
   :db-sync/failed?
   :db-sync/outliner-op
   :db-sync/forward-outliner-ops
   :db-sync/inverse-outliner-ops
   :db-sync/inferred-outliner-ops?
   :db-sync/normalized-tx-data
   :db-sync/reversed-tx-data])

(defn usage []
  (str "Usage: pnpm exec nbb-logseq script/export_client_ops_ops.cljs <client-ops-db> [--out <file.edn>]\n"
       "Options:\n"
       (cli/format-opts {:spec spec})))

(defn resolve-path
  [path*]
  (if (node-path/isAbsolute path*)
    path*
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path*)))

(defn default-output-path
  [input-path]
  (let [resolved (resolve-path input-path)
        dir (node-path/dirname resolved)
        base (node-path/basename resolved)
        name (node-path/parse base)
        stem (or (.-name name) base)]
    (node-path/join dir (str stem "-ops.edn"))))

(defn entity->op
  [db eid]
  (let [ent (d/entity db eid)]
    (merge
     {:db/id (:db/id ent)}
     (select-keys (into {} ent) op-keys))))

(defn read-ops
  [conn]
  (let [db @conn]
    (->> (d/datoms db :avet :db-sync/created-at)
         (map (fn [datom] (entity->op db (:e datom))))
         (sort-by (juxt :db-sync/created-at :db/id))
         vec)))

(defn -main
  [argv]
  (let [{:keys [opts args]} (cli/parse-args argv {:spec spec})
        [input-path] args]
    (when (or (:help opts) (nil? input-path))
      (println (usage))
      (js/process.exit (if (:help opts) 0 1)))
    (let [db-path (resolve-path input-path)
          _ (when-not (fs/existsSync db-path)
              (println "Client ops db file does not exist:" db-path)
              (js/process.exit 1))
          out-path (resolve-path (or (:out opts) (default-output-path db-path)))
          open-args (sqlite-cli/->open-db-args db-path)
          {:keys [conn sqlite]} (apply sqlite-cli/open-sqlite-datascript! open-args)]
      (try
        (let [ops (read-ops conn)]
          (println "Read" (count ops) "ops from" db-path)
          (println "Writing ops EDN to" out-path)
          (fs/writeFileSync out-path (with-out-str (pprint/pprint ops))))
        (finally
          (when sqlite
            (.close sqlite)))))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
