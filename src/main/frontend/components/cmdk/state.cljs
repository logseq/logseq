(ns frontend.components.cmdk.state
  "Persist query and filter group from the last cmdk query"
  (:require [frontend.storage :as storage]))

(def cmdk-last-search-storage-key :ls-cmdk-last-search)
(def cmdk-empty-repo-key "__no-repo__")

(defn- repo-storage-key
  [repo]
  (or repo cmdk-empty-repo-key))

(defn default-cmdk-context?
  [opts search-mode _search-args]
  (and (not (:sidebar? opts))
       (nil? (:initial-input opts))
       (contains? #{nil :global} search-mode)))

(defn load-last-cmdk-search
  [repo]
  (try
    (let [saved (storage/get cmdk-last-search-storage-key)
          entry (when (map? saved)
                  (get saved (repo-storage-key repo)))]
      (when (map? entry)
        {:query (if (string? (:query entry))
                  (:query entry)
                  "")
         :filter-group (when (keyword? (:filter-group entry))
                         (:filter-group entry))}))
    (catch :default _e
      nil)))

(defn save-last-cmdk-search!
  [repo query filter-group]
  (try
    (let [saved (storage/get cmdk-last-search-storage-key)
          saved (if (map? saved) saved {})
          value {:query (if (string? query) query "")
                 :filter-group (when (keyword? filter-group) filter-group)
                 :updated-at (.now js/Date)}]
      (storage/set cmdk-last-search-storage-key
                   (assoc saved (repo-storage-key repo) value)))
    (catch :default _e
      nil)))

(defn- explicit-mode-filter-group
  [opts search-mode]
  (when (and search-mode
             (not (contains? #{:global :graph} search-mode))
             (not (:sidebar? opts)))
    {:group search-mode}))

(defn build-initial-cmdk-search
  [opts search-mode search-args repo]
  (if (some? (:initial-input opts))
    (let [filter-group (explicit-mode-filter-group opts search-mode)]
      {:input (or (:initial-input opts) "")
       :filter filter-group})
    (let [saved (when (default-cmdk-context? opts search-mode search-args)
                  (load-last-cmdk-search repo))
          filter-group (or (when (keyword? (:filter-group saved))
                             {:group (:filter-group saved)})
                           (explicit-mode-filter-group opts search-mode))]
      {:input (or (:query saved) "")
       :filter filter-group})))

(defn persist-last-cmdk-search!
  [opts search-mode search-args repo input filter-state]
  (when (default-cmdk-context? opts search-mode search-args)
    (save-last-cmdk-search! repo input (:group filter-state))))

(defn cmdk-block-search-options
  [{:keys [filter-group dev? action page-uuid]}]
  (let [nodes-base {:limit 100
                    :dev? dev?
                    :built-in? true
                    :enable-snippet? false}]
    (case filter-group
      :code
      (assoc nodes-base
             ;; larger limit for code search since most of the results will be filtered out
             :search-limit 300
             :code-only? true)

      :current-page
      (cond-> {:limit 100
               :enable-snippet? false}
        page-uuid
        (assoc :page (str page-uuid)))

      ;; default to nodes behavior
      (cond-> nodes-base
        (contains? #{:move-blocks} action)
        (assoc :page-only? true)))))
