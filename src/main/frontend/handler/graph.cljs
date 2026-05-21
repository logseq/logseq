(ns frontend.handler.graph
  "Provides util handler fns for graph view"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.common.idb :as idb]
            [frontend.db :as db]
            [frontend.graph-tab :as graph-tab]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.graph-registry :as graph-registry]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def graph-registry-key
  "ls-graph-registry")

(def normalize-registry-entry graph-registry/normalize-entry)

(def resolve-registry-target graph-registry/resolve-target)

(def set-tab-graph! graph-tab/set-tab-graph!)
(def get-tab-graph graph-tab/get-tab-graph)

(defn- storage-registry->clj
  [registry]
  (let [registry' (bean/->clj registry)]
    (if (sequential? registry')
      (vec registry')
      [])))

(defn <get-graph-registry
  []
  (p/let [registry (idb/get-item graph-registry-key)]
    (storage-registry->clj registry)))

(defn <upsert-graph-registry-entry!
  [entry]
  (let [entry' (-> entry
                   normalize-registry-entry
                   (assoc :updated-at (js/Date.now)))]
    (if (util/electron?)
      (ipc/ipc "upsertGraphRegistryEntry" entry')
      (p/let [registry (<get-graph-registry)
              registry' (graph-registry/upsert-entry registry entry')]
        (idb/set-item! graph-registry-key (bean/->js registry'))))))

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

(defn resolve-startup-repo
  [registry repos url-target tab-graph current-repo]
  (let [registry' (concat registry (registry-from-repo-summaries repos))
        tab-repo (:repo tab-graph)
        tab-graph-id (:graph-id tab-graph)
        repo-exists? (fn [repo]
                       (some #(= repo (:url %)) repos))
        url-target-repo (:repo (resolve-registry-target registry' url-target))
        tab-target-repo (when (and (nil? url-target-repo)
                                   (string/blank? (:graph-id url-target)))
                          (or (when (and (not (string/blank? tab-repo))
                                         (repo-exists? tab-repo))
                                tab-repo)
                              (:repo (resolve-registry-target
                                      registry'
                                      {:graph-id tab-graph-id}))))]
    (or url-target-repo
        tab-target-repo
        current-repo
        (:url (first repos)))))

(defn current-graph-id
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [db* (db/get-db repo)]
      (some-> (or (ldb/get-graph-rtc-uuid db*)
                  (ldb/get-graph-local-uuid db*))
              str))))

(defn remember-current-graph-id-in-tab!
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [graph-id (current-graph-id)]
      (set-tab-graph! repo graph-id))))

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
