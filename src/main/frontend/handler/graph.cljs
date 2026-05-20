(ns frontend.handler.graph
  "Provides util handler fns for graph view"
  (:require [electron.ipc :as ipc]
            [frontend.common.idb :as idb]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.graph-registry :as graph-registry]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def graph-registry-key
  :ls-graph-registry)

(def normalize-registry-entry graph-registry/normalize-entry)

(def resolve-registry-target graph-registry/resolve-target)

(defn <get-graph-registry
  []
  (p/let [registry (idb/get-item graph-registry-key)]
    (or registry [])))

(defn <upsert-graph-registry-entry!
  [entry]
  (let [entry' (-> entry
                   normalize-registry-entry
                   (assoc :updated-at (js/Date.now)))]
    (if (util/electron?)
      (ipc/ipc "upsertGraphRegistryEntry" entry')
      (p/let [registry (<get-graph-registry)
              registry' (graph-registry/upsert-entry registry entry')]
        (idb/set-item! graph-registry-key registry')))))

(defn repo-summary->registry-entry
  [{:keys [url GraphName GraphUUID metadata sync-meta] :as repo}]
  (when url
    (let [rtc-graph-id (some-> (or GraphUUID
                                   (:kv/value metadata)
                                   (second sync-meta))
                               str)
          local-graph-id (some-> (:local-graph-id repo) str)]
      (when (or rtc-graph-id local-graph-id)
        (normalize-registry-entry
         {:repo url
          :graph-name (or GraphName
                          (common-config/strip-leading-db-version-prefix url))
          :rtc-graph-id rtc-graph-id
          :local-graph-id local-graph-id})))))

(defn registry-from-repo-summaries
  [repos]
  (keep repo-summary->registry-entry repos))

(defn current-graph-id
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [db* (db/get-db repo)]
      (some-> (or (ldb/get-graph-rtc-uuid db*)
                  (ldb/get-graph-local-uuid db*))
              str))))

(defn <upsert-current-graph-registry!
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [db* (db/get-db repo)]
      (<upsert-graph-registry-entry!
       {:repo repo
        :graph-name (common-config/strip-leading-db-version-prefix repo)
        :local-graph-id (some-> (ldb/get-graph-local-uuid db*) str)
        :rtc-graph-id (some-> (ldb/get-graph-rtc-uuid db*) str)}))))

(defn settle-metadata-to-local!
  [m]
  (when-let [repo (state/get-current-repo)]
    (try
      (let [k :ls-graphs-metadata
            ret (or (storage/get k) {})
            ret (update ret repo merge m {:_v (js/Date.now)})]
        (storage/set k ret))
      (catch js/Error e
        (js/console.warn e)))))

(defn get-metadata-local
  []
  (let [k :ls-graphs-metadata]
    (storage/get k)))
