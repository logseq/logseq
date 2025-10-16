(ns frontend.handler.db-based.import
  "Handles DB graph imports"
  (:require [clojure.edn :as edn]
            [datascript.core :as d]
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
            [promesa.core :as p]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]))

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
      (db/transact! graph (sqlite-util/import-tx :sqlite-db) {:import-db? true})
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
        db-or-datoms (ldb/read-transit-str raw)
        datoms (if (d/db? db-or-datoms) (vec (d/datoms db-or-datoms :eavt)) db-or-datoms)]
    (p/do!
     (persist-db/<new graph {:import-type :debug-transit
                             :datoms datoms})
     (state/add-repo! {:url graph})
     (repo-handler/restore-and-setup-repo! graph {:import-type :debug-transit})
     (db/transact! graph (sqlite-util/import-tx :debug-transit) {:import-db? true})
     (state/set-current-repo! graph)
     (finished-ok-handler))))

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
      (-> (p/let
           [_ (persist-db/<new graph {:import-type :edn})
            _ (state/add-repo! {:url graph})
            _ (repo-handler/restore-and-setup-repo! graph {:import-type :edn})
            _ (state/set-current-repo! graph)
            {:keys [error]} (ui-outliner-tx/transact!
                             {:outliner-op :batch-import-edn}
                             (outliner-op/batch-import-edn! edn-data {:tx-meta {:import-db? true}}))]
            (if error
              (do
                (notification/show! error :error)
                (finished-error-handler))
              (finished-ok-handler)))
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
                  (let [ent (db/entity [:block/uuid eid])]
                    (if-not (:block/page ent)
                      {:error "Can't import block into a non-block entity. Please import block elsewhere."}
                      (merge (select-keys ent [:block/uuid])
                             {:block/page (select-keys (:block/page ent) [:block/uuid])})))
                  (notification/show! "No block found" :warning)))]
    (cond (or (= ::invalid-import export-map) (not (map? export-map)))
          (notification/show! "The submitted EDN data is invalid! Please fix and try again." :warning)
          (:error block)
          (do
            (notification/show! (:error block) :error)
            (shui/dialog-close-all!))
          :else
          (p/let [{:keys [error]}
                  (ui-outliner-tx/transact!
                   {:outliner-op :batch-import-edn}
                   (outliner-op/batch-import-edn! export-map (when block {:current-block block})))]
            ;; Also close cmd-k
            (shui/dialog-close-all!)
            (ui-handler/re-render-root!)
            (if error
              (notification/show! error :error)
              (notification/show! "Import successful!" :success))))))

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
