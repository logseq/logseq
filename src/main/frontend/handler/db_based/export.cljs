(ns frontend.handler.db-based.export
  "Handles DB graph exports and imports across graphs"
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [goog.dom :as gdom]
            [logseq.db.sqlite.export :as sqlite-export]
            [promesa.core :as p]))

(defn- <export-edn-helper
  "Gets export-edn and validates export for smaller exports. Copied from component.export/<export-edn-helper"
  [export-args]
  (p/let [export-edn (state/<invoke-db-worker :thread-api/export-edn (state/get-current-repo) export-args)]
    (if-let [error (:error (sqlite-export/validate-export export-edn))]
      (do
        (js/console.log "Invalid export EDN:")
        (pprint/pprint export-edn)
        {:export-edn-error error})
      export-edn)))

(defn ^:export export-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (p/let [result (state/<invoke-db-worker :thread-api/export-edn
                                            (state/get-current-repo)
                                            {:export-type :block :block-id [:block/uuid block-uuid]})
            pull-data (with-out-str (pprint/pprint result))]
      (when-not (:export-edn-error result)
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied block's data!" :success)))
    (notification/show! "No block found" :warning)))

(defn export-view-nodes-data [rows {:keys [group-by?]}]
  (p/let [result (<export-edn-helper {:export-type :view-nodes
                                      :rows rows
                                      :group-by? group-by?})
          pull-data (with-out-str (pprint/pprint result))]
    (if (:export-edn-error result)
      (notification/show! (:export-edn-error result) :error)
      (do (.writeText js/navigator.clipboard pull-data)
          (println pull-data)
          (notification/show! "Copied view nodes' data!" :success)))))

(defn ^:export export-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (p/let [result (<export-edn-helper {:export-type :page :page-id page-id})
            pull-data (with-out-str (pprint/pprint result))]
      (if (:export-edn-error result)
        (notification/show! (:export-edn-error result) :error)
        (do (.writeText js/navigator.clipboard pull-data)
            (println pull-data)
            (notification/show! "Copied page's data!" :success))))
    (notification/show! "No page found" :warning)))

(defn ^:export export-graph-ontology-data []
  (p/let [result (state/<invoke-db-worker :thread-api/export-edn
                                          (state/get-current-repo)
                                          {:export-type :graph-ontology})
          pull-data (with-out-str (pprint/pprint result))]
    (when-not (:export-edn-error result)
      (.writeText js/navigator.clipboard pull-data)
      (println pull-data)
      (js/console.log (str "Exported " (count (:classes result)) " classes and "
                           (count (:properties result)) " properties"))
      (notification/show! "Copied graphs's ontology data!" :success))))

;; Copied from handler.export
(defn- file-name [repo extension]
  (-> repo
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn export-repo-as-db-edn!
  "Run db validation before exporting EDN"
  [repo]
  (p/let [validate-result (state/<invoke-db-worker :thread-api/validate-db
                                                   (state/get-current-repo))
          {:keys [errors]} validate-result
          _ (when (seq errors)
              (throw (ex-info "Graph validation failed" validate-result)))
          result (state/<invoke-db-worker :thread-api/export-edn
                                          (state/get-current-repo)
                                          {:export-type :graph
                                           :graph-options {:include-timestamps? true}})
          pull-data (with-out-str (pprint/pprint result))]
    (when-not (:export-edn-error result)
      (let [data-str (some->> pull-data
                              js/encodeURIComponent
                              (str "data:text/edn;charset=utf-8,"))
            filename (file-name repo :edn)]
        (when-let [anchor (gdom/getElement "download-as-db-edn")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" filename)
          (.click anchor))))))
