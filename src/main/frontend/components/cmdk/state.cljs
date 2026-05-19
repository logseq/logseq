(ns frontend.components.cmdk.state
  "State helpers for command palette search."
  (:require [frontend.storage :as storage]
            [frontend.util :as util]))

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

(defn consume-open-search-sidebar-keydown!
  [event open-search!]
  (when (and (util/meta-key? event)
             (= "Enter" (.-key event)))
    (util/stop event)
    (open-search!)
    true))

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
  [{:keys [filter-group dev? action page-uuid expanded?]}]
  (let [nodes-limit (if expanded? 100 10)
        nodes-base {:limit nodes-limit
                    :search-limit 100
                    :dev? dev?
                    :built-in? true
                    :enable-snippet? true
                    :include-matched-count? true}]
    (case filter-group
      :code
      (assoc nodes-base
             :limit 20
             ;; larger limit for code search since most of the results will be filtered out
             :search-limit 300
             :code-only? true)

      :current-page
      (cond-> {:limit nodes-limit
               :search-limit 100
               :enable-snippet? true
               :include-matched-count? true}
        page-uuid
        (assoc :page (str page-uuid)))

      ;; default to nodes behavior
      (cond-> nodes-base
        (contains? #{:move-blocks} action)
        (assoc :page-only? true)))))
