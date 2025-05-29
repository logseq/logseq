(ns frontend.handler.db-based.import
  "Handles DB graph imports"
  (:require [cljs.pprint :as pprint]
            [clojure.edn :as edn]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn import-from-sqlite-db!
  [buffer bare-graph-name finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)]
    (->
     (p/do!
      (persist-db/<import-db graph buffer)
      (state/add-repo! {:url graph})
      (repo-handler/restore-and-setup-repo! graph {:import-type :sqlite-db})
      (state/set-current-repo! graph)
      (persist-db/<export-db graph {})
      (db/transact! graph (sqlite-util/import-tx :sqlite-db))
      (finished-ok-handler))
     (p/catch
      (fn [e]
        (js/console.error e)
        (notification/show!
         (str (.-message e))
         :error))))))

(defn import-from-debug-transit!
  [bare-graph-name raw finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)
        datoms (ldb/read-transit-str raw)]
    (p/do!
     (persist-db/<new graph {:import-type :debug-transit
                             :datoms datoms})
     (state/add-repo! {:url graph})
     (repo-handler/restore-and-setup-repo! graph {:import-type :debug-transit})
     (db/transact! graph (sqlite-util/import-tx :debug-transit))
     (state/set-current-repo! graph)
     (finished-ok-handler))))

(defn- safe-build-edn-import [export-map import-options]
  (try
    (sqlite-export/build-import export-map (db/get-db) import-options)
    (catch :default e
      (js/console.error "Import EDN error: " e)
      {:error "An unexpected error occurred building the import. See the javascript console for details."})))

(defn- import-edn-data-from-file
  [export-map]
  (let [{:keys [init-tx block-props-tx misc-tx error] :as _txs} (safe-build-edn-import export-map {})]
    ;; (cljs.pprint/pprint _txs)
    (if error
      (notification/show! error :error)
      (let [tx-meta {::sqlite-export/imported-data? true}
            repo (state/get-current-repo)]
        (p/do
          (db/transact! repo init-tx tx-meta)
          (when (seq block-props-tx)
            (db/transact! repo block-props-tx tx-meta))
          (when (seq misc-tx)
            (db/transact! repo misc-tx tx-meta)))))))

(defn import-from-edn-file!
  "Creates a new DB graph and imports sqlite.build EDN file"
  [bare-graph-name file-body finished-ok-handler]
  (let [graph (str config/db-version-prefix bare-graph-name)
        finished-error-handler
        #(do
           (state/set-state! :graph/importing nil)
           (shui/dialog-close-all!))
        edn-data (try
                   (edn/read-string file-body)
                   (catch :default e
                     (js/console.error e)
                     (notification/show! "The given EDN file is not valid EDN. Please fix and try again."
                                         :error)
                     (finished-error-handler)
                     nil))]
    (when (some? edn-data)
      (-> (p/do!
           (persist-db/<new graph {:import-type :edn})
           (state/add-repo! {:url graph})
           (repo-handler/restore-and-setup-repo! graph {:import-type :edn})
           (state/set-current-repo! graph)
           (import-edn-data-from-file edn-data)
           (finished-ok-handler))
          (p/catch
           (fn [e]
             (js/console.error e)
             (notification/show! (str "Unexpected error: " (.-message e))
                                 :error)
             (finished-error-handler)))))))

(defn- import-edn-data-from-form [import-inputs _e]
  (let [export-map (try (edn/read-string (:import-data @import-inputs)) (catch :default _err ::invalid-import))
        import-block? (::sqlite-export/block export-map)
        block (when import-block?
                (if-let [eid (:block-id (first (state/get-editor-args)))]
                  (db/entity [:block/uuid eid])
                  (notification/show! "No block found" :warning)))]
    (if (= ::invalid-import export-map)
      (notification/show! "The submitted EDN data is invalid! Please fix and try again." :warning)
      (let [{:keys [init-tx block-props-tx misc-tx error] :as txs}
            (safe-build-edn-import export-map (when block {:current-block block}))]
        (pprint/pprint txs)
        (if error
          (notification/show! error :error)
          ;; TODO: When not import-block, use metadata that supports undo
          (let [tx-meta (if import-block? {:outliner-op :save-block} {::sqlite-export/imported-data? true})
                repo (state/get-current-repo)]
            (-> (p/do
                  (db/transact! repo init-tx tx-meta)
                  (when (seq block-props-tx)
                    (db/transact! repo block-props-tx tx-meta))
                  (when (seq misc-tx)
                    (db/transact! repo misc-tx tx-meta))
                  (when-not import-block?
                    (ui-handler/re-render-root!)
                    (notification/show! "Import successful!" :success)))
                (p/catch (fn [e]
                           (js/console.error "Import EDN error: " e)
                           (notification/show! "An unexpected error occurred during import. See the javascript console for details." :error))))))
        ;; Also close cmd-k
        (shui/dialog-close-all!)))))

(defn ^:export import-edn-data-dialog
  "Displays dialog which allows users to paste and import sqlite.build EDN Data"
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
                    :on-click (partial import-edn-data-from-form import-inputs)}
                   "Import")])))
