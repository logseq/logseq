(ns frontend.handler.db-based.export
  "Handles DB graph exports and imports across graphs"
  (:require [cljs.pprint :as pprint]
            [clojure.edn :as edn]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn ^:export export-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (when-let [^Object worker @state/*db-worker]
      (p/let [result* (.export-edn worker
                                   (state/get-current-repo)
                                   (ldb/write-transit-str {:export-type :block :block-id [:block/uuid block-uuid]}))
              result (ldb/read-transit-str result*)
              pull-data (with-out-str (pprint/pprint result))]
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied block's data!" :success)))
    (notification/show! "No block found" :warning)))

(defn ^:export export-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (when-let [^Object worker @state/*db-worker]
      (p/let [result* (.export-edn worker (state/get-current-repo) (ldb/write-transit-str {:export-type :page :page-id page-id}))
              result (ldb/read-transit-str result*)
              pull-data (with-out-str (pprint/pprint result))]
        (.writeText js/navigator.clipboard pull-data)
        (println pull-data)
        (notification/show! "Copied page's data!" :success)))
    (notification/show! "No page found" :warning)))

(defn ^:export export-graph-ontology-data []
  (when-let [^Object worker @state/*db-worker]
    (p/let [result* (.export-edn worker (state/get-current-repo) (ldb/write-transit-str {:export-type :graph-ontology}))
            result (ldb/read-transit-str result*)
            pull-data (with-out-str (pprint/pprint result))]
      (.writeText js/navigator.clipboard pull-data)
      (println pull-data)
      (js/console.log (str "Exported " (count (:classes result)) " classes and "
                           (count (:properties result)) " properties"))
      (notification/show! "Copied graphs's ontology data!" :success))))

(defn- import-submit [import-inputs _e]
  (let [export-map (try (edn/read-string (:import-data @import-inputs)) (catch :default _err ::invalid-import))
        import-block? (::sqlite-export/block export-map)
        block (when import-block?
                (if-let [eid (:block-id (first (state/get-editor-args)))]
                  (db/entity [:block/uuid eid])
                  (notification/show! "No block found" :warning)))]
    (if (= ::invalid-import export-map)
      (notification/show! "The submitted EDN data is invalid! Fix and try again." :warning)
      (let [{:keys [init-tx block-props-tx error] :as txs}
            (sqlite-export/build-import export-map
                                        (db/get-db)
                                        (when block {:current-block block}))]
        (pprint/pprint txs)
        (if error
          (notification/show! error :error)
          (p/do
            ;; TODO: Use metadata that supports undo
            (db/transact! (state/get-current-repo) init-tx
                          (if import-block? {:save-block true} {::sqlite-export/imported-data? true}))

            (when (seq block-props-tx)
              (db/transact! (state/get-current-repo) block-props-tx
                            (if import-block? {:save-block true} {::sqlite-export/imported-data? true})))

            (when-not import-block?
              (state/clear-async-query-state!)
              (ui-handler/re-render-root!)
              (notification/show! "Import successful!" :success))))
        ;; Also close cmd-k
        (shui/dialog-close-all!)))))

(defn ^:export import-edn-data
  []
  (let [import-inputs (atom {:import-data "" :import-block? false})]
    (shui/dialog-open!
     [:div
      [:label.flex.my-2.text-lg "Import EDN Data"]
      #_[:label.block.flex.items-center.py-3
         (shui/checkbox {:on-checked-change #(swap! import-inputs update :import-block? not)})
         [:small.pl-2 (str "Import into current block")]]
      (shui/textarea {:placeholder "{}"
                      :class "overflow-y-auto"
                      :rows 10
                      :auto-focus true
                      :on-change (fn [^js e] (swap! import-inputs assoc :import-data (util/evalue e)))})
      (shui/button {:class "mt-3"
                    :on-click (partial import-submit import-inputs)}
                   "Import")])))
