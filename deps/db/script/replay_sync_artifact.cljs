(ns replay-sync-artifact
  "Replay sync simulation artifacts with DataScript + checksum logic in nbb."
  (:require ["node:fs" :as fs]
            ["node:path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db.frontend.schema :as db-schema]
            [nbb.core :as nbb]))

(def cli-spec
  {:help {:alias :h
          :desc "Show help"}
   :artifact {:alias :a
              :desc "Path to artifact.json"
              :coerce :string}
   :client {:alias :c
            :desc "Only replay one client instance index"
            :coerce :long}
   :round {:alias :r
           :desc "Only replay one round index"
           :coerce :long}
   :pretty {:desc "Pretty-print JSON output"}})

(def checksum-attr-map
  {"uuid" :block/uuid
   "title" :block/title
   "name" :block/name
   "parent" :block/parent
   "page" :block/page
   "order" :block/order
   ":block/uuid" :block/uuid
   ":block/title" :block/title
   ":block/name" :block/name
   ":block/parent" :block/parent
   ":block/page" :block/page
   ":block/order" :block/order
   "block/uuid" :block/uuid
   "block/title" :block/title
   "block/name" :block/name
   "block/parent" :block/parent
   "block/page" :block/page
   "block/order" :block/order})

(def checksum-attrs (set (vals checksum-attr-map)))

(defn usage []
  (str "Usage: yarn -s nbb-logseq -cp src:script:../db-sync/src script/replay_sync_artifact.cljs --artifact <path> [--client <n>] [--round <n>] [--pretty]\n"
       "Options:\n"
       (cli/format-opts {:spec cli-spec})))

(defn parse-uuid
  [value]
  (when (string? value)
    (try
      (uuid value)
      (catch :default _
        nil))))

(defn parse-int
  [value]
  (when-not (nil? value)
    (let [n (js/Number value)]
      (when (js/Number.isInteger n)
        (int n)))))

(defn parse-attr
  [value]
  (cond
    (keyword? value)
    value

    (string? value)
    (let [trimmed (string/trim value)]
      (or (get checksum-attr-map trimmed)
          (get checksum-attr-map (string/lower-case trimmed))
          (when (string/starts-with? trimmed ":")
            (get checksum-attr-map (subs trimmed 1)))))

    :else
    nil))

(defn snapshot-block->entity
  [block]
  (let [id (parse-int (get block "id"))
        uuid-value (parse-uuid (get block "uuid"))]
    (when (and id uuid-value)
      (cond-> {:db/id id
               :block/uuid uuid-value}
        (string? (get block "title"))
        (assoc :block/title (get block "title"))

        (string? (get block "name"))
        (assoc :block/name (get block "name"))

        (string? (get block "order"))
        (assoc :block/order (get block "order"))

        (parse-int (get block "parentId"))
        (assoc :block/parent (parse-int (get block "parentId")))

        (parse-int (get block "pageId"))
        (assoc :block/page (parse-int (get block "pageId")))))))

(defn datom->tx
  [datom]
  (let [e (parse-int (get datom "e"))
        attr (parse-attr (get datom "a"))
        added? (not= false (get datom "added"))
        value (get datom "v")]
    (when (and e (contains? checksum-attrs attr))
      (let [value' (case attr
                     :block/uuid (or (parse-uuid value) value)
                     :block/parent (or (parse-int value) value)
                     :block/page (or (parse-int value) value)
                     value)]
        [(if added? :db/add :db/retract) e attr value']))))

(defn replay-round
  [client round]
  (let [initial-db (get round "initialDb")
        blocks (if (map? initial-db) (get initial-db "blocks") nil)
        tx-log (-> (get round "txCapture") (get "txLog"))
        initial-entities (if (sequential? blocks)
                           (keep snapshot-block->entity blocks)
                           [])
        db0 (d/db-with (d/empty-db db-schema/schema) initial-entities)
        checksum0 (sync-checksum/recompute-checksum db0)
        replay-result
        (reduce
         (fn [{:keys [db checksum mismatches tx-count] :as acc} tx-entry]
           (let [datoms (if (map? tx-entry) (get tx-entry "datoms") nil)
                 tx-data (if (sequential? datoms) (keep datom->tx datoms) [])
                 op-index (when (map? tx-entry) (parse-int (get tx-entry "opIndex")))]
             (if (empty? tx-data)
               (assoc acc :tx-count (inc tx-count))
               (let [report (d/with db tx-data)
                     db' (:db-after report)
                     incremental (sync-checksum/update-checksum checksum report)
                     full (sync-checksum/recompute-checksum db')]
                 {:db db'
                  :checksum incremental
                  :tx-count (inc tx-count)
                  :mismatches
                  (cond-> mismatches
                    (not= incremental full)
                    (conj {:txIndex tx-count
                           :opIndex op-index
                           :incremental incremental
                           :full full
                           :txSize (count tx-data)}))}))))
         {:db db0
          :checksum checksum0
          :mismatches []
          :tx-count 0}
         (if (sequential? tx-log) tx-log []))]
    {:instanceIndex (parse-int (get client "instanceIndex"))
     :round (parse-int (get round "round"))
     :initialBlockCount (count initial-entities)
     :txCount (:tx-count replay-result)
     :mismatchCount (count (:mismatches replay-result))
     :firstMismatch (first (:mismatches replay-result))
     :finalChecksum (:checksum replay-result)}))

(defn select-rounds
  [client opts]
  (let [rounds (if (sequential? (get client "rounds")) (get client "rounds") [])]
    (if-let [round-index (:round opts)]
      (filter #(= round-index (parse-int (get % "round"))) rounds)
      rounds)))

(defn select-clients
  [artifact opts]
  (let [clients (if (sequential? (get artifact "clients")) (get artifact "clients") [])]
    (if-let [instance-index (:client opts)]
      (filter #(= instance-index (parse-int (get % "instanceIndex"))) clients)
      clients)))

(defn -main
  [argv]
  (let [{:keys [opts]} (cli/parse-args argv {:spec cli-spec})
        artifact-path (:artifact opts)]
    (when (or (:help opts) (string/blank? artifact-path))
      (println (usage))
      (js/process.exit (if (:help opts) 0 1)))
    (let [resolved-path (.resolve node-path artifact-path)
          content (.readFileSync fs resolved-path "utf8")
          artifact (js->clj (js/JSON.parse content))
          selected-clients (vec (select-clients artifact opts))
          results (->> selected-clients
                       (mapcat (fn [client]
                                 (map #(replay-round client %)
                                      (select-rounds client opts))))
                       (vec))
          payload {:artifactPath resolved-path
                   :runId (get artifact "runId")
                   :createdAt (get artifact "createdAt")
                   :selectedClient (or (:client opts) nil)
                   :selectedRound (or (:round opts) nil)
                   :resultCount (count results)
                   :results results}]
      (if (:pretty opts)
        (println (js/JSON.stringify (clj->js payload) nil 2))
        (println (js/JSON.stringify (clj->js payload)))))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
