(ns frontend.handler.common.developer
  "Common fns for developer related functionality"
  (:require [cljs.pprint :as pprint]
            [clojure.edn :as edn]
            [datascript.impl.entity :as de]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

;; Fns used between menus and commands
(defn show-entity-data
  [eid]
  (let [result* (db/pull eid)
        entity (db/entity eid)
        result (cond-> result*
                 (and (seq (:block/properties entity)) (config/db-based-graph? (state/get-current-repo)))
                 (assoc :block.debug/properties
                        (->> (:block/properties entity)
                             (map (fn [[k v]]
                                    [k
                                     (cond
                                       (de/entity? v)
                                       (db-property/property-value-content v)
                                       (and (set? v) (every? de/entity? v))
                                       (set (map db-property/property-value-content v))
                                       :else
                                       v)]))
                             (into {})))
                 (seq (:block/refs result*))
                 (assoc :block.debug/refs
                        (mapv #(or (:block/title (db/entity (:db/id %))) %) (:block/refs result*))))
        pull-data (with-out-str (pprint/pprint result))]
    (println pull-data)
    (notification/show!
     [:div.ls-wrap-widen
      [:pre.code pull-data]
      [:br]
      (ui/button "Copy to clipboard"
                 :on-click #(.writeText js/navigator.clipboard pull-data))]
     :success
     false)))

(defn show-content-ast
  [content format]
  (let [ast-data (-> (mldoc/->edn content format)
                     pprint/pprint
                     with-out-str)]
    (println ast-data)
    (notification/show!
     [:div.ls-wrap-widen
      ;; Show clipboard at top since content is really long for pages
      (ui/button "Copy to clipboard"
                 :on-click #(.writeText js/navigator.clipboard ast-data))
      [:br]
      [:pre.code ast-data]]
     :success
     false)))

(defn- import-submit [import-inputs _e]
  (let [export-map (try (edn/read-string (:import-data @import-inputs)) (catch :default _err ::invalid-import))
        import-block? (:build/block export-map)
        block (when import-block?
                (if-let [eid (:block-id (first (state/get-editor-args)))]
                  (db/entity [:block/uuid eid])
                  (notification/show! "No block found" :warning)))]
    (if (= ::invalid-import export-map)
      (notification/show! "The submitted EDN data is invalid! Fix and try again." :warning)
      (let [{:keys [init-tx block-props-tx error] :as txs}
            (sqlite-export/build-import (db/get-db)
                                        (when block {:current-block block})
                                        export-map)]
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

;; Public Commands
(defn ^:export show-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (show-entity-data [:block/uuid block-uuid])
    (notification/show! "No block found" :warning)))

(defn ^:export show-block-ast []
  (if-let [{:block/keys [title format]} (:block (first (state/get-editor-args)))]
    (show-content-ast title (or format :markdown))
    (notification/show! "No block found" :warning)))

(defn ^:export show-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (show-entity-data page-id)
    (notification/show! "No page found" :warning)))

(defn ^:export show-page-ast []
  (if (config/db-based-graph? (state/get-current-repo))
    (notification/show! "Command not available yet for DB graphs" :warning)
    (let [page-data (db/pull '[:block/format {:block/file [:file/content]}]
                             (page-util/get-current-page-id))]
      (if (get-in page-data [:block/file :file/content])
        (show-content-ast (get-in page-data [:block/file :file/content])
                          (get page-data :block/format :markdown))
        (notification/show! "No page found" :warning)))))

(defn ^:export export-block-data []
  ;; Use editor state to locate most recent block
  (if-let [block-uuid (:block-id (first (state/get-editor-args)))]
    (let [result (sqlite-export/build-block-export (db/get-db) [:block/uuid block-uuid])
          pull-data (with-out-str (pprint/pprint result))]
      (.writeText js/navigator.clipboard pull-data)
      (println pull-data)
      (notification/show! "Copied block's data!" :success))
    (notification/show! "No block found" :warning)))

(defn ^:export export-page-data []
  (if-let [page-id (page-util/get-current-page-id)]
    (let [result (sqlite-export/build-page-export (db/get-db) page-id)
          pull-data (with-out-str (pprint/pprint result))]
      (.writeText js/navigator.clipboard pull-data)
      (println pull-data)
      (notification/show! "Copied page's data!" :success))
    (notification/show! "No page found" :warning)))

(defn ^:export export-graph-ontology-data []
  (let [result (sqlite-export/build-graph-ontology-export (db/get-db))
        pull-data (with-out-str (pprint/pprint result))]
    (.writeText js/navigator.clipboard pull-data)
    (println pull-data)
    (js/console.log (str "Exported " (count (:classes result)) " classes and "
                         (count (:properties result)) " properties"))
    (notification/show! "Copied graphs's ontology data!" :success)))

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

(defn ^:export validate-db []
  (when-let [^Object worker @state/*db-worker]
    (.validate-db worker (state/get-current-repo))))

(defn import-chosen-graph
  [repo]
  (p/let [_ (persist-db/<unsafe-delete repo)]
    (notification/show! (str "Graph updated! Switching to graph ...") :success)
    (state/pub-event! [:graph/switch repo])))

(defn ^:export replace-graph-with-db-file []
  (state/pub-event! [:dialog-select/db-graph-replace]))
