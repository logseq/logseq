(ns frontend.handler.db-based.editor
  "DB-based graph implementation"
  (:require [frontend.commands :as commands]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.format.block :as block]
            [frontend.handler.common.config-edn :as config-edn-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.schema.handler.repo-config :as repo-config-schema]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.uuid :as common-uuid]
            [logseq.graph-parser.db-input :as db-input]
            [logseq.outliner.op]
            [promesa.core :as p]))

(defn- ref-summary
  [ref]
  (select-keys ref [:db/id :block/uuid :block/title :block/name :db/ident :block/tags]))

(defn- collect-known-refs
  [block]
  (->> (concat (state/get-state :editor/block-refs)
               (map ref-summary (:block/refs block)))
       (util/distinct-by-last-wins :block/uuid)))

(defn- warn-missing-uuid-refs!
  "Warn once per [:block/uuid id] ref that doesn't resolve to an entity."
  [refs]
  (when-let [uuids (seq (into #{}
                              (keep (fn [ref]
                                      (when (and (vector? ref)
                                                 (= :block/uuid (first ref))
                                                 (uuid? (second ref)))
                                        (second ref))))
                              refs))]
    (when-let [repo (state/get-current-repo)]
      (p/let [results (db-async/<get-blocks repo uuids)]
        (doseq [{:keys [block]} results]
          (when (nil? block)
            (notification/show! (t :block/ref-not-exist) :warning)))))))

(defn wrap-parse-block
  [block]
  (let [parsed (db-input/parse-block-input
                block {:repo (state/get-current-repo)
                       :user-config (state/get-config)
                       :date-formatter (state/get-date-formatter)
                       :cached-refs (collect-known-refs block)
                       :parse-block (fn [block _options] (block/parse-block block))
                       :resolve-refs (fn [refs _ast _tags] refs)})]
    (warn-missing-uuid-refs! (:block/refs parsed))
    parsed))

(defn save-file!
  "This fn is the db version of file-handler/alter-file"
  [path content]
  (let [file-valid? (if (= path "logseq/config.edn")
                      (do (config-edn-common-handler/detect-deprecations path content)
                          (config-edn-common-handler/validate-config-edn path content repo-config-schema/Config-edn))
                      true)]

    (when file-valid?
      (p/let [repo (state/get-current-repo)
              file-entity (state/<invoke-db-worker :thread-api/pull repo [:db/id] [:file/path path])]
        (p/do!
         (state/<invoke-db-worker :thread-api/transact
                                  repo
                                  [(cond-> {:file/path path
                                            :file/content content
                                            :file/created-at (js/Date.)
                                            :file/last-modified-at (js/Date.)}
                                     (nil? file-entity)
                                     (assoc :block/uuid (common-uuid/gen-uuid :builtin-block-uuid path)))]
                                  nil
                                  nil)
        ;; Post save
         (cond (= path "logseq/config.edn")
               (p/let [_ (repo-config-handler/restore-repo-config! repo content)]
                 (state/pub-event! [:shortcut/refresh]))
               (= path "logseq/custom.css")
               (ui-handler/add-style-if-exists!)))))))

(defn batch-set-heading!
  [block-ids heading]
  (let [repo (state/get-current-repo)]
    (p/let [results (db-async/<get-blocks repo block-ids)
            blocks (keep :block results)]
      (ui-outliner-tx/transact!
       {:outliner-op :save-block}
       (doseq [{:block/keys [uuid raw-title]} blocks]
         (let [new-raw-title (commands/clear-markdown-heading raw-title)]
           (when (not= new-raw-title raw-title)
             (property-handler/set-block-property! uuid :block/title new-raw-title))))
       (property-handler/batch-set-block-property! block-ids :logseq.property/heading heading)))))
