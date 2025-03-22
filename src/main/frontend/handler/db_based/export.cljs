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
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn ^:export export-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (when-let [worker @state/*db-worker]
      (p/let [result* (worker :general/export-edn
                              (state/get-current-repo)
                              (ldb/write-transit-str {:export-type :block :block-id [:block/uuid block-uuid]}))
              result (ldb/read-transit-str result*)
              pull-data (with-out-str (pprint/pprint result))]
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied block's data!" :success)))
    (notification/show! "No block found" :warning)))

(defn export-view-nodes-data [nodes]
  (let [block-uuids (mapv #(vector :block/uuid (:block/uuid %)) nodes)]
    (when-let [worker @state/*db-worker]
      (p/let [result* (worker :general/export-edn
                              (state/get-current-repo)
                              (ldb/write-transit-str {:export-type :view-nodes :node-ids block-uuids}))
              result (ldb/read-transit-str result*)
              pull-data (with-out-str (pprint/pprint result))]
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied block's data!" :success)))))

(defn ^:export export-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (when-let [worker @state/*db-worker]
      (p/let [result* (worker :general/export-edn
                              (state/get-current-repo) (ldb/write-transit-str {:export-type :page :page-id page-id}))
              result (ldb/read-transit-str result*)
              pull-data (with-out-str (pprint/pprint result))]
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied page's data!" :success)))
    (notification/show! "No page found" :warning)))

(defn ^:export export-graph-ontology-data []
  (when-let [worker @state/*db-worker]
    (p/let [result* (worker :general/export-edn
                            (state/get-current-repo) (ldb/write-transit-str {:export-type :graph-ontology}))
            result (ldb/read-transit-str result*)
            pull-data (with-out-str (pprint/pprint result))]
      (.writeText js/navigator.clipboard pull-data)
      (println pull-data)
      (js/console.log (str "Exported " (count (:classes result)) " classes and "
                           (count (:properties result)) " properties"))
      (notification/show! "Copied graphs's ontology data!" :success))))

(defn- export-graph-edn-data []
  (when-let [worker @state/*db-worker]
    (p/let [result* (worker :general/export-edn
                            (state/get-current-repo)
                            (ldb/write-transit-str {:export-type :graph
                                                    :graph-options {:include-timestamps? true}}))
            result (ldb/read-transit-str result*)
            pull-data (with-out-str (pprint/pprint result))]
      pull-data)))

;; Copied from handler.export
(defn- file-name [repo extension]
  (-> (string/replace repo config/local-db-prefix "")
      (string/replace #"^/+" "")
      (str "_" (quot (util/time-ms) 1000))
      (str "." (string/lower-case (name extension)))))

(defn export-repo-as-db-edn!
  [repo]
  (p/let [edn-str (export-graph-edn-data)]
    (when edn-str
      (let [data-str (some->> edn-str
                              js/encodeURIComponent
                              (str "data:text/edn;charset=utf-8,"))
            filename (file-name repo :edn)]
        (when-let [anchor (gdom/getElement "download-as-db-edn")]
          (.setAttribute anchor "href" data-str)
          (.setAttribute anchor "download" filename)
          (.click anchor))))))
