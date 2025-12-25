(ns frontend.test.file
  "Provides util handler fns for file graph files"
  (:refer-clojure :exclude [load-file])
  (:require [frontend.db :as db]
            [frontend.db.file-based.model :as file-model]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.schema.handler.global-config :as global-config-schema]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [frontend.test.file.reset :as file-reset]
            [frontend.util :as util]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]))

(defn reset-file!
  [repo file-path content opts]
  (when util/node-test?
    (file-reset/reset-file! repo (db/get-db repo false) file-path content opts)))

(defn- detect-deprecations
  [path content]
  (when (or (= path "logseq/config.edn")
            (= (path/dirname path) (global-config-handler/safe-global-config-dir)))
    (config-edn-common-handler/detect-deprecations path content {:db-graph? false})))

(defn- validate-file
  "Returns true if valid and if false validator displays error message. Files
  that are not validated just return true"
  [path content]
  (cond
    (= path "logseq/config.edn")
    (config-edn-common-handler/validate-config-edn path content repo-config-schema/Config-edn)

    (= (path/dirname path) (global-config-handler/safe-global-config-dir))
    (config-edn-common-handler/validate-config-edn path content global-config-schema/Config-edn)

    :else
    true))

(defn alter-file-test-version
  "Test version of alter-file that is synchronous"
  [repo path content {:keys [reset? from-disk? new-graph? verbose
                             ctime mtime]
                      :fs/keys [event]
                      :or {reset? true
                           from-disk? false}}]
  (let [path (common-util/path-normalize path)
        config-file? (= path "logseq/config.edn")
        _ (when config-file?
            (detect-deprecations path content))
        config-valid? (and config-file? (validate-file path content))]
    (when (or config-valid? (not config-file?)) ; non-config file or valid config
      (let [opts {:new-graph? new-graph?
                  :from-disk? from-disk?
                  :fs/event event
                  :ctime ctime
                  :mtime mtime}
            result (if reset?
                     (do
                       (when-let [page-id (file-model/get-file-page-id path)]
                         (db/transact! repo
                                       [[:db/retract page-id :block/alias]
                                        [:db/retract page-id :block/tags]]
                                       opts))
                       (reset-file!
                        repo path content (merge opts
                                                         ;; To avoid skipping the `:or` bounds for keyword destructuring
                                                 (when (some? verbose) {:verbose verbose}))))
                     (db/set-file-content! repo path content opts))]
        result))))
